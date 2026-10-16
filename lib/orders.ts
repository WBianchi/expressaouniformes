// Pedidos da loja (pronta-entrega): esquema do checkout, recálculo no servidor, tipos e persistência.
// Funções puras (sem "server-only") para poderem ser testadas com node:test e usadas pelo cliente
// apenas para tipos/validação. A persistência (Neon) só roda quando DATABASE_URL existe.
import { z } from "zod";
import { getColor, getProduct, positionFees, type Position, type Size } from "./catalog.ts";
import {
  type CartLine,
  type Coupon,
  type ShippingOption,
  lineQuantity,
  lineTotal,
  maxInstallments,
  quoteShipping,
  totals,
  unitPrice,
  validateCoupon,
} from "./pricing.ts";
import { addressSchema, cartLineSchema, customerSchema } from "./validation.ts";

// ---------------------------------------------------------------- documentos e cartão

const digits = (v: string) => v.replace(/\D/g, "");

export function isValidCpf(value: string) {
  const d = digits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

export function isValidCnpj(value: string) {
  const d = digits(value);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((s, w, i) => s + Number(d[i]) * w, 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

export const isValidDocument = (v: string, type?: "pf" | "pj") => {
  const len = digits(v).length;
  if (type === "pf") return isValidCpf(v);
  if (type === "pj") return isValidCnpj(v);
  return len === 11 ? isValidCpf(v) : isValidCnpj(v);
};

export function luhn(number: string) {
  const d = digits(number);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export type CardBrand = "visa" | "mastercard" | "amex" | "elo" | "hipercard" | "diners" | "discover" | "jcb" | "unknown";

const ELO = /^(4011(78|79)|43(1274|8935)|45(1416|7393|763(1|2))|50(4175|6699|67[0-7][0-9]|9000)|627780|63(6297|6368)|650(03([^4])|04([0-9])|05(0|1)|4(0[5-9]|3[0-9]|8[5-9]|9[0-9])|5([0-2][0-9]|3[0-8])|9([2-6][0-9]|7[0-8])|541|700|720|901)|651652|655000|655021)/;

export function detectBrand(number: string): CardBrand {
  const d = digits(number);
  if (!d) return "unknown";
  if (ELO.test(d)) return "elo";
  if (/^(606282|3841)/.test(d)) return "hipercard";
  if (/^3[47]/.test(d)) return "amex";
  if (/^3(0[0-5]|[68])/.test(d)) return "diners";
  if (/^35(2[89]|[3-8])/.test(d)) return "jcb";
  if (/^(6011|65|64[4-9])/.test(d)) return "discover";
  if (/^(5[1-5]|2(2[2-9][1-9]|2[3-9]|[3-6]|7[01]|720))/.test(d)) return "mastercard";
  if (/^4/.test(d)) return "visa";
  return "unknown";
}

/** "MM/AA" ou "MM/AAAA" → { month: "MM", year: "AAAA" } se válida e não expirada. */
export function parseExpiry(value: string, now = new Date()) {
  const m = value.trim().match(/^(\d{2})\s*\/\s*(\d{2}|\d{4})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const year = m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2]);
  if (month < 1 || month > 12) return null;
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  if (endOfMonth < now || year > now.getFullYear() + 20) return null;
  return { month: String(month).padStart(2, "0"), year: String(year) };
}

// ---------------------------------------------------------------- esquema do checkout

export const paymentMethods = ["pix", "boleto", "cartao"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];
/** id da opção de frete: "retirada", "f-<código Frenet>" ou ids da estimativa local */
export const shippingIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/, "Selecione uma opção de frete válida.");

export const cardSchema = z.object({
  holderName: z.string().trim().min(3, "Nome impresso no cartão").max(80),
  number: z.string().refine(luhn, "Número do cartão inválido"),
  expiry: z.string().refine((v) => !!parseExpiry(v), "Validade inválida"),
  ccv: z.string().regex(/^\d{3,4}$/, "CVV inválido"),
});
export type CardInput = z.infer<typeof cardSchema>;

export const checkoutCustomerSchema = customerSchema
  .extend({ name: z.string().trim().min(3, "Informe o nome completo").max(120), email: z.email("E-mail inválido").max(160) })
  .superRefine((c, ctx) => {
    if (!isValidDocument(c.document, c.type))
      ctx.addIssue({ code: "custom", path: ["document"], message: c.type === "pj" ? "CNPJ inválido" : "CPF inválido" });
    if (c.type === "pj" && !c.company?.trim())
      ctx.addIssue({ code: "custom", path: ["company"], message: "Informe a razão social" });
  });

export const checkoutAddressSchema = addressSchema.extend({
  state: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "UF"),
  street: z.string().trim().min(2, "Informe a rua").max(160),
  number: z.string().trim().min(1, "Número").max(20),
  complement: z.string().trim().max(80).optional(),
  district: z.string().trim().min(2, "Informe o bairro").max(80),
  city: z.string().trim().min(2, "Informe a cidade").max(80),
});

export const checkoutRequestSchema = z.object({
  idempotencyKey: z.string().regex(/^[a-zA-Z0-9-]{16,64}$/),
  customer: checkoutCustomerSchema,
  address: checkoutAddressSchema,
  lines: z.array(cartLineSchema).min(1, "Carrinho vazio").max(30),
  coupon: z.string().trim().max(40).nullish(),
  shippingId: shippingIdSchema,
  payment: z.object({
    method: z.enum(paymentMethods),
    installments: z.number().int().min(1).max(12).default(1),
    /** ausente no modo demonstração; obrigatório quando o Asaas está ativo e método = cartão */
    card: cardSchema.optional(),
  }),
  /** total exibido ao cliente; usado só para detectar divergência (nunca para cobrar) */
  expectedTotal: z.number().nonnegative().optional(),
  notes: z.string().max(1000).optional(),
});
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

// ---------------------------------------------------------------- recálculo

export type QuoteLine = {
  slug: string;
  name: string;
  color: string;
  colorName: string;
  sizes: Partial<Record<Size, number>>;
  positions: Position[];
  qty: number;
  unitPrice: number;
  total: number;
  logo?: { name: string; thumb: string };
  notes?: string;
};

export type OrderQuote = {
  lines: QuoteLine[];
  items: number;
  subtotal: number;
  discount: number;
  coupon: Pick<Coupon, "code" | "label"> | null;
  shipping: ShippingOption;
  /** total antes do desconto Pix */
  total: number;
  /** desconto Pix aplicado (0 para outros métodos) */
  pixDiscount: number;
  /** valor efetivamente cobrado */
  chargeTotal: number;
  method: PaymentMethod;
  installments: number;
  installmentValue: number;
};

const round = (n: number) => Math.round(n * 100) / 100;

/** Recalcula o pedido a partir do catálogo. Nunca usa preços enviados pelo navegador. */
export function computeQuote(input: {
  lines: CartLine[];
  coupon?: string | null;
  cep: string;
  shippingId: string;
  method: PaymentMethod;
  installments?: number;
  /** opções cotadas no servidor (Frenet); sem elas usa a estimativa local */
  shippingOptions?: ShippingOption[] | null;
}): { ok: true; quote: OrderQuote } | { ok: false; error: string } {
  if (!input.lines.length) return { ok: false, error: "Carrinho vazio." };
  const base = totals(input.lines);
  let coupon: Coupon | null = null;
  if (input.coupon) {
    const r = validateCoupon(input.coupon, base.subtotal);
    if (!r.ok) return { ok: false, error: r.error };
    coupon = r.coupon;
  }
  const options = input.shippingOptions ?? quoteShipping(input.cep, base.subtotal, base.items);
  const shipping = options?.find((o) => o.id === input.shippingId);
  if (!shipping) return { ok: false, error: "Selecione uma opção de frete válida." };
  const t = totals(input.lines, coupon, shipping);
  const method = input.method;
  const max = maxInstallments(t.total);
  const installments = method === "cartao" ? Math.floor(input.installments ?? 1) : 1;
  if (installments < 1 || installments > max)
    return { ok: false, error: `Parcelamento disponível em até ${max}x sem juros.` };
  const chargeTotal = method === "pix" ? t.pixTotal : t.total;
  if (chargeTotal <= 0) return { ok: false, error: "Total inválido." };
  return {
    ok: true,
    quote: {
      lines: input.lines.map((l) => ({
        slug: l.slug,
        name: getProduct(l.slug)?.name ?? l.slug,
        color: l.color,
        colorName: getColor(l.color)?.name ?? l.color,
        sizes: l.sizes,
        positions: l.positions,
        qty: lineQuantity(l),
        unitPrice: unitPrice(l),
        total: lineTotal(l),
        logo: l.logo,
        notes: l.notes,
      })),
      items: t.items,
      subtotal: t.subtotal,
      discount: t.discount,
      coupon: coupon ? { code: coupon.code, label: coupon.label } : null,
      shipping: { ...shipping, price: t.shipping },
      total: t.total,
      pixDiscount: method === "pix" ? round(t.total - t.pixTotal) : 0,
      chargeTotal,
      method,
      installments,
      installmentValue: round(chargeTotal / installments),
    },
  };
}

/** Descrição da cobrança no Asaas (aparece na fatura do cliente e no painel). Máx. 500 caracteres. */
export function orderDescription(orderId: string, q: Pick<OrderQuote, "items" | "lines" | "shipping">) {
  const items = q.lines.map((l) => `${l.qty}x ${l.name} ${l.colorName}`).join("; ");
  const text = `Pedido ${orderId} — Expressão Uniformes — ${q.items} peças: ${items}. Entrega: ${q.shipping.label}.`;
  return text.length > 500 ? `${text.slice(0, 497)}...` : text;
}

/** Extrai os itens da descrição gravada pelo checkout: "... — 20 peças: 10x Polo Marinho; 10x ... Entrega: X." */
export function parseDescription(desc?: string | null) {
  const d = desc ?? "";
  const itemsPart = d.match(/peças:\s*(.*?)(?:\.\s*Entrega:|$)/)?.[1] ?? "";
  const items = itemsPart
    .split(";")
    .map((s) => s.trim().match(/^(\d+)x\s+(.+)$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({ name: m[2].replace(/\.\.\.$/, ""), qty: Number(m[1]) }));
  const shipping = d.match(/Entrega:\s*(.*?)\.?$/)?.[1];
  return { items, shipping };
}

export const positionsLabel = (p: Position[]) =>
  p.length ? p.map((x) => positionFees[x].label).join(", ") : "Sem personalização";

// ---------------------------------------------------------------- pedido e status

export type OrderStatus =
  | "aguardando_pagamento"
  | "pago"
  | "em_analise"
  | "vencido"
  | "recusado"
  | "cancelado"
  | "estornado";

/** Status do pagamento em português (lido por /conta e /pedido). */
export type PaymentStatus = "pendente" | "pago" | "em análise" | "vencido" | "recusado" | "cancelado" | "estornado";

export function paymentStatusFromAsaas(status?: string | null): PaymentStatus {
  switch ((status ?? "").toUpperCase()) {
    case "RECEIVED":
    case "CONFIRMED":
    case "RECEIVED_IN_CASH":
      return "pago";
    case "AWAITING_RISK_ANALYSIS":
    case "AUTHORIZED":
      return "em análise";
    case "OVERDUE":
      return "vencido";
    case "REFUNDED":
    case "REFUND_REQUESTED":
    case "REFUND_IN_PROGRESS":
    case "CHARGEBACK_REQUESTED":
      return "estornado";
    case "DELETED":
      return "cancelado";
    default:
      return "pendente";
  }
}

/** Mapeia evento de webhook do Asaas → status de pagamento (null = evento ignorado). */
export function paymentStatusFromEvent(event: string): PaymentStatus | null {
  switch (event) {
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED":
      return "pago";
    case "PAYMENT_AWAITING_RISK_ANALYSIS":
    case "PAYMENT_AUTHORIZED":
      return "em análise";
    case "PAYMENT_APPROVED_BY_RISK_ANALYSIS":
    case "PAYMENT_CREATED":
    case "PAYMENT_RESTORED":
    case "PAYMENT_RECEIVED_IN_CASH_UNDONE":
      return "pendente";
    case "PAYMENT_OVERDUE":
      return "vencido";
    case "PAYMENT_REPROVED_BY_RISK_ANALYSIS":
    case "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED":
      return "recusado";
    case "PAYMENT_DELETED":
    case "PAYMENT_BANK_SLIP_CANCELLED":
      return "cancelado";
    case "PAYMENT_REFUNDED":
    case "PAYMENT_PARTIALLY_REFUNDED":
    case "PAYMENT_CHARGEBACK_REQUESTED":
      return "estornado";
    default:
      return null;
  }
}

export function orderStatusFromPayment(p: PaymentStatus): OrderStatus {
  switch (p) {
    case "pago":
      return "pago";
    case "em análise":
      return "em_analise";
    case "vencido":
      return "vencido";
    case "recusado":
      return "recusado";
    case "cancelado":
      return "cancelado";
    case "estornado":
      return "estornado";
    default:
      return "aguardando_pagamento";
  }
}

/**
 * Evita regressões por webhooks fora de ordem: um pedido pago só sai de "pago" por estorno/cancelamento.
 * Retorna o status final a gravar.
 */
export function nextPaymentStatus(current: PaymentStatus | string, incoming: PaymentStatus): PaymentStatus {
  if (current === "pago" && !["estornado", "cancelado"].includes(incoming)) return "pago";
  if (current === "estornado") return "estornado";
  return incoming;
}

export function newOrderId(now = new Date()) {
  const y = String(now.getFullYear()).slice(2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(5)))
    .map((b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32])
    .join("");
  return `EU-${y}${m}${d}-${rand}`;
}

export const ORDER_ID_RE = /^EU-\d{6}-[A-Z0-9]{5}$/;

/** Dados de pagamento devolvidos ao navegador (sem nada sensível). */
export type PublicPayment = {
  id: string | null;
  method: PaymentMethod;
  status: PaymentStatus;
  invoiceUrl?: string;
  installments?: number;
  installmentValue?: number;
  pix?: { encodedImage: string; payload: string; expirationDate?: string };
  boleto?: { identificationField?: string; bankSlipUrl?: string; dueDate?: string };
};

export type CheckoutResponse = {
  orderId: string;
  demo: boolean;
  createdAt: string;
  status: OrderStatus;
  quote: Omit<OrderQuote, "lines"> & { lines: Omit<QuoteLine, "logo">[] };
  payment: PublicPayment;
};

/** Formato gravado em localStorage `eu-orders` (lido pela área Minha conta). */
export type StoredOrder = {
  id: string;
  createdAt: string;
  status: string;
  total: number;
  items: { slug: string; name: string; qty: number; color: string }[];
  payment?: { method: string; status: string; invoiceUrl?: string };
  layout?: { status: "aguardando" };
  demo?: boolean;
};

export function toStoredOrder(r: CheckoutResponse): StoredOrder {
  return {
    id: r.orderId,
    createdAt: r.createdAt,
    status: r.status,
    total: r.quote.chargeTotal,
    items: r.quote.lines.map((l) => ({ slug: l.slug, name: l.name, qty: l.qty, color: l.color })),
    payment: { method: r.payment.method, status: r.payment.status, invoiceUrl: r.payment.invoiceUrl },
    layout: { status: "aguardando" },
    ...(r.demo ? { demo: true } : {}),
  };
}

export function publicQuote(q: OrderQuote): CheckoutResponse["quote"] {
  return { ...q, lines: q.lines.map(({ logo: _logo, ...rest }) => rest) };
}

// ---------------------------------------------------------------- persistência (Neon, opcional)

export type ShopOrderRecord = {
  id: string;
  idempotencyKey: string;
  createdAt: string;
  status: OrderStatus;
  customer: { type: "pf" | "pj"; name: string; company?: string; document: string; email: string; phone: string };
  address: z.infer<typeof checkoutAddressSchema>;
  quote: OrderQuote;
  notes?: string;
  asaasCustomerId?: string;
  payment: PublicPayment;
};

export const hasDatabase = () => !!process.env.DATABASE_URL;

async function sql() {
  const { neon } = await import("@neondatabase/serverless");
  return neon(process.env.DATABASE_URL!);
}

const cents = (n: number) => Math.round(n * 100);

/** Reserva o pedido (chave de idempotência única). Retorna false se a chave já existe. */
export async function insertOrder(o: ShopOrderRecord): Promise<boolean> {
  if (!hasDatabase()) return true;
  const db = await sql();
  const rows = await db`
    INSERT INTO expressao.shop_orders
      (id, idempotency_key, status, payment_method, payment_status, total_cents, customer_email, data)
    VALUES (${o.id}, ${o.idempotencyKey}, ${o.status}, ${o.payment.method}, ${o.payment.status},
            ${cents(o.quote.chargeTotal)}, ${o.customer.email.toLowerCase()}, ${JSON.stringify(o)}::jsonb)
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id`;
  return rows.length > 0;
}

export async function updateOrderPayment(
  id: string,
  patch: { status: OrderStatus; payment: PublicPayment; asaasCustomerId?: string },
) {
  if (!hasDatabase()) return;
  const db = await sql();
  const extra = JSON.stringify({ status: patch.status, payment: patch.payment, asaasCustomerId: patch.asaasCustomerId });
  await db`
    UPDATE expressao.shop_orders
       SET status = ${patch.status}, payment_status = ${patch.payment.status},
           asaas_payment_id = COALESCE(${patch.payment.id}, asaas_payment_id),
           data = data || ${extra}::jsonb, updated_at = now()
     WHERE id = ${id}`;
}

export async function findOrderByIdempotencyKey(key: string): Promise<ShopOrderRecord | null> {
  if (!hasDatabase()) return null;
  const db = await sql();
  const rows = await db`SELECT data FROM expressao.shop_orders WHERE idempotency_key = ${key} LIMIT 1`;
  return (rows[0]?.data as ShopOrderRecord | undefined) ?? null;
}

/**
 * Aplica um evento de webhook de forma idempotente (tabela de eventos com id único).
 * Retorna "duplicate" se o evento já foi processado.
 */
export async function applyPaymentEvent(e: {
  eventId: string;
  event: string;
  paymentId: string;
  externalReference?: string | null;
  status: PaymentStatus;
}): Promise<"applied" | "duplicate" | "no-db" | "not-found"> {
  if (!hasDatabase()) return "no-db";
  const db = await sql();
  const inserted = await db`
    INSERT INTO expressao.asaas_webhook_events (id, event, payment_id)
    VALUES (${e.eventId}, ${e.event}, ${e.paymentId})
    ON CONFLICT (id) DO NOTHING RETURNING id`;
  if (!inserted.length) return "duplicate";
  try {
    const ref = e.externalReference && ORDER_ID_RE.test(e.externalReference) ? e.externalReference : null;
    const rows = await db`
      SELECT id, payment_status FROM expressao.shop_orders
       WHERE asaas_payment_id = ${e.paymentId} OR (${ref}::text IS NOT NULL AND id = ${ref})
       LIMIT 1`;
    const row = rows[0] as { id: string; payment_status: string } | undefined;
    if (!row) return "not-found";
    const payment = nextPaymentStatus(row.payment_status, e.status);
    const status = orderStatusFromPayment(payment);
    const patch = JSON.stringify({ status });
    await db`
      UPDATE expressao.shop_orders
         SET payment_status = ${payment}, status = ${status},
             asaas_payment_id = COALESCE(asaas_payment_id, ${e.paymentId}),
             data = jsonb_set(data || ${patch}::jsonb, '{payment,status}', to_jsonb(${payment}::text)),
             updated_at = now()
       WHERE id = ${row.id}`;
    return "applied";
  } catch (err) {
    // libera o evento para que a nova tentativa do Asaas seja processada
    await db`DELETE FROM expressao.asaas_webhook_events WHERE id = ${e.eventId}`.catch(() => {});
    throw err;
  }
}
