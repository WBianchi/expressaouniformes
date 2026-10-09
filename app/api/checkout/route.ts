import {
  AsaasError,
  asaasConfig,
  asaasMode,
  createOrFindCustomer,
  createPayment,
  dueDateFromToday,
  getBoletoLine,
  getPixQrCode,
  type AsaasPaymentInput,
} from "@/lib/asaas";
import {
  type CheckoutResponse,
  type PublicPayment,
  type ShopOrderRecord,
  checkoutRequestSchema,
  computeQuote,
  findOrderByIdempotencyKey,
  insertOrder,
  newOrderId,
  orderStatusFromPayment,
  parseExpiry,
  paymentStatusFromAsaas,
  publicQuote,
  updateOrderPayment,
} from "@/lib/orders";
import type { CartLine } from "@/lib/pricing";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY = 6_000_000; // logos em miniatura (≤ 300 KB cada) podem ir junto
const fail = (error: string, status: number, extra: Record<string, unknown> = {}) =>
  Response.json({ error, ...extra }, { status, headers: { "Cache-Control": "no-store" } });

// ------------------------------------------------ proteção simples por instância
// (idempotência real fica no banco via chave única; isto cobre o modo sem banco e cliques repetidos)
const recent = new Map<string, { at: number; body: CheckoutResponse }>();
const inFlight = new Set<string>();
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 12;
}

function remember(key: string, body: CheckoutResponse) {
  recent.set(key, { at: Date.now(), body });
  if (recent.size > 500) {
    const oldest = [...recent.entries()].sort((a, b) => a[1].at - b[1].at).slice(0, 100);
    for (const [k] of oldest) recent.delete(k);
  }
}

/** Aceita só requisições do próprio site (Origin precisa bater com o host atendido). */
function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const host = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || req.headers.get("host");
  return originHost === (host || new URL(req.url).host);
}

function clientIp(req: Request) {
  const h = req.headers;
  const raw = h.get("x-vercel-forwarded-for") || h.get("x-forwarded-for") || h.get("x-real-ip") || "";
  const ip = raw.split(",")[0]?.trim();
  return ip && /^[0-9a-fA-F:.]{3,45}$/.test(ip) ? ip : undefined;
}

/** Informa ao navegador se os pagamentos estão ativos (sem revelar nada além do modo). */
export function GET() {
  return Response.json({ mode: asaasMode() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Origem inválida.", 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return fail("Formato inválido.", 415);
  if (Number(request.headers.get("content-length")) > MAX_BODY) return fail("Pedido muito grande. Remova logos pesadas.", 413);

  const ip = clientIp(request);
  if (rateLimited(ip ?? "local")) return fail("Muitas tentativas. Aguarde um minuto e tente novamente.", 429);

  let parsed;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return fail("Pedido muito grande. Remova logos pesadas.", 413);
    parsed = checkoutRequestSchema.safeParse(JSON.parse(raw));
  } catch {
    return fail("Dados inválidos.", 400);
  }
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    // nunca ecoa valores recebidos (podem conter dados de cartão)
    return fail(issue?.message && issue.message.length < 120 ? issue.message : "Confira os dados do pedido.", 422, {
      field: issue?.path.join("."),
    });
  }
  const input = parsed.data;

  // ------------------------------------------------ recálculo no servidor
  const q = computeQuote({
    lines: input.lines as CartLine[],
    coupon: input.coupon,
    cep: input.address.cep,
    shippingId: input.shippingId,
    method: input.payment.method,
    installments: input.payment.installments,
  });
  if (!q.ok) return fail(q.error, 422);
  const quote = q.quote;
  if (input.expectedTotal !== undefined && Math.abs(input.expectedTotal - quote.chargeTotal) > 0.01)
    return fail("Os valores do pedido foram atualizados. Confira o resumo antes de finalizar.", 409, {
      code: "price_changed",
      quote: publicQuote(quote),
    });

  // ------------------------------------------------ modo demonstração
  if (!asaasConfig())
    return fail(
      "Pagamento em modo demonstração: a integração com o Asaas ainda não foi configurada. Nenhuma cobrança será feita.",
      503,
      { code: "payments_disabled", demo: true, quote: publicQuote(quote) },
    );

  if (input.payment.method === "cartao" && !input.payment.card) return fail("Informe os dados do cartão.", 422);

  // ------------------------------------------------ idempotência
  const key = input.idempotencyKey;
  const cached = recent.get(key);
  if (cached) return Response.json(cached.body, { headers: { "Cache-Control": "no-store" } });
  if (inFlight.has(key)) return fail("Seu pedido já está sendo processado.", 409, { code: "in_progress" });
  inFlight.add(key);

  try {
    const existing = await findOrderByIdempotencyKey(key).catch(() => null);
    if (existing) {
      if (!existing.payment.id) return fail("Seu pedido já está sendo processado.", 409, { code: "in_progress" });
      return Response.json(responseFrom(existing, false), { headers: { "Cache-Control": "no-store" } });
    }

    const orderId = newOrderId();
    const createdAt = new Date().toISOString();
    const c = input.customer;
    const a = input.address;
    const record: ShopOrderRecord = {
      id: orderId,
      idempotencyKey: key,
      createdAt,
      status: "aguardando_pagamento",
      customer: {
        type: c.type,
        name: c.name,
        company: c.company?.trim() || undefined,
        document: c.document.replace(/\D/g, ""),
        email: c.email,
        phone: c.phone.replace(/\D/g, ""),
      },
      address: a,
      quote,
      notes: input.notes,
      payment: { id: null, method: quote.method, status: "pendente", installments: quote.installments },
    };

    try {
      if (!(await insertOrder(record))) return fail("Seu pedido já está sendo processado.", 409, { code: "in_progress" });
    } catch {
      return fail("Não foi possível registrar o pedido. Tente novamente.", 500);
    }

    // ------------------------------------------------ Asaas
    try {
      const customerId = await createOrFindCustomer({
        name: c.type === "pj" && c.company ? c.company.trim() : c.name,
        company: c.type === "pj" ? c.company?.trim() : undefined,
        cpfCnpj: record.customer.document,
        email: c.email,
        mobilePhone: record.customer.phone,
        postalCode: a.cep.replace(/\D/g, ""),
        address: a.street,
        addressNumber: a.number,
        complement: a.complement || undefined,
        province: a.district,
      });

      const billingType = ({ pix: "PIX", boleto: "BOLETO", cartao: "CREDIT_CARD" } as const)[quote.method];
      const payload: AsaasPaymentInput = {
        customer: customerId,
        billingType,
        value: quote.chargeTotal,
        dueDate: dueDateFromToday(quote.method === "boleto" ? 3 : quote.method === "pix" ? 1 : 0),
        description: `Pedido ${orderId} — Expressão Uniformes (${quote.items} peças)`,
        externalReference: orderId,
      };
      if (quote.method === "cartao") {
        const card = input.payment.card!;
        const exp = parseExpiry(card.expiry)!;
        payload.creditCard = {
          holderName: card.holderName,
          number: card.number.replace(/\D/g, ""),
          expiryMonth: exp.month,
          expiryYear: exp.year,
          ccv: card.ccv,
        };
        payload.creditCardHolderInfo = {
          name: card.holderName,
          email: c.email,
          cpfCnpj: record.customer.document,
          postalCode: a.cep.replace(/\D/g, ""),
          addressNumber: a.number,
          addressComplement: a.complement || undefined,
          phone: record.customer.phone,
          mobilePhone: record.customer.phone,
        };
        if (ip) payload.remoteIp = ip;
        if (quote.installments > 1) {
          payload.installmentCount = quote.installments;
          payload.totalValue = quote.chargeTotal;
        }
      }

      const payment = await createPayment(payload);
      const status = paymentStatusFromAsaas(payment.status);
      const pub: PublicPayment = {
        id: payment.id,
        method: quote.method,
        status,
        invoiceUrl: payment.invoiceUrl,
        installments: quote.installments,
        installmentValue: quote.installmentValue,
      };
      if (quote.method === "pix") {
        const qr = await getPixQrCode(payment.id).catch(() => null);
        if (qr) pub.pix = { encodedImage: qr.encodedImage, payload: qr.payload, expirationDate: qr.expirationDate };
      }
      if (quote.method === "boleto") {
        const line = await getBoletoLine(payment.id).catch(() => null);
        pub.boleto = {
          identificationField: line?.identificationField,
          bankSlipUrl: payment.bankSlipUrl ?? undefined,
          dueDate: payment.dueDate,
        };
      }

      record.status = orderStatusFromPayment(status);
      record.payment = pub;
      record.asaasCustomerId = customerId;
      await updateOrderPayment(orderId, { status: record.status, payment: pub, asaasCustomerId: customerId }).catch(() => {
        // o webhook ainda vincula o pagamento pelo externalReference
      });

      const body = responseFrom(record, false);
      remember(key, body);
      return Response.json(body, { headers: { "Cache-Control": "no-store" } });
    } catch (err) {
      const e = err instanceof AsaasError ? err : new AsaasError(500, []);
      const refused = quote.method === "cartao" && e.status === 400;
      await updateOrderPayment(orderId, {
        status: refused ? "recusado" : "cancelado",
        payment: { ...record.payment, status: refused ? "recusado" : "cancelado" },
      }).catch(() => {});
      // log mínimo, sem payload nem dados pessoais
      console.error(`[checkout] falha Asaas pedido=${orderId} status=${e.status} code=${e.code ?? "-"}`);
      return fail(
        refused ? `Pagamento não aprovado. ${e.publicMessage}` : e.publicMessage,
        refused ? 402 : e.status === 400 ? 422 : 502,
        { code: refused ? "card_refused" : "payment_failed" },
      );
    }
  } finally {
    inFlight.delete(key);
  }
}

function responseFrom(r: ShopOrderRecord, demo: boolean): CheckoutResponse {
  return {
    orderId: r.id,
    demo,
    createdAt: r.createdAt,
    status: r.status,
    quote: publicQuote(r.quote),
    payment: r.payment,
  };
}
