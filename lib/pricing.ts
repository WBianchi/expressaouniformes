// Regras de preço puras: usadas no cliente (exibição) e no servidor (cobrança).
// O servidor sempre recalcula a partir do catálogo; nunca confiar em valores enviados pelo navegador.
import { getProduct, positionFees, type Position, type Size } from "./catalog.ts";

export type CartLine = {
  id: string;
  slug: string;
  color: string;
  sizes: Partial<Record<Size, number>>;
  positions: Position[];
  /** logo de cada posição: miniatura (dataURL ≤ ~150 KB) e nome do arquivo */
  logos?: Partial<Record<Position, { name: string; thumb: string }>>;
  /** formato antigo (uma logo para todas as posições); lido só para carrinhos já salvos */
  logo?: { name: string; thumb: string };
  notes?: string;
};

export const lineQuantity = (l: Pick<CartLine, "sizes">) =>
  Object.values(l.sizes).reduce<number>((a, b) => a + (b || 0), 0);

/** Desconto progressivo por quantidade total da linha. */
export const volumeTiers = [
  { min: 100, off: 0.15, label: "100+ peças" },
  { min: 50, off: 0.1, label: "50+ peças" },
  { min: 20, off: 0.05, label: "20+ peças" },
] as const;

export const volumeDiscount = (qty: number) =>
  volumeTiers.find((t) => qty >= t.min)?.off ?? 0;

export function unitPrice(l: Pick<CartLine, "slug" | "positions" | "sizes">) {
  const p = getProduct(l.slug);
  if (!p || p.kind !== "stock") return 0;
  const fees = l.positions.reduce((s, pos) => s + positionFees[pos].fee, 0);
  const base = p.price + fees;
  return round(base * (1 - volumeDiscount(lineQuantity(l))));
}

export const lineTotal = (l: CartLine) => round(unitPrice(l) * lineQuantity(l));

// ---------------- cupons ----------------
export type Coupon = {
  code: string;
  label: string;
  type: "percent" | "fixed" | "shipping";
  value: number;
  minSubtotal?: number;
};

export const coupons: Coupon[] = [
  { code: "BEMVINDO10", label: "10% na primeira compra", type: "percent", value: 0.1 },
  { code: "EMPRESA50", label: "R$ 50 off acima de R$ 500", type: "fixed", value: 50, minSubtotal: 500 },
  { code: "FRETEGRATIS", label: "Frete grátis", type: "shipping", value: 0, minSubtotal: 200 },
];

export function validateCoupon(code: string, subtotal: number): { ok: true; coupon: Coupon } | { ok: false; error: string } {
  const c = coupons.find((x) => x.code === code.trim().toUpperCase());
  if (!c) return { ok: false, error: "Cupom inválido ou expirado." };
  if (c.minSubtotal && subtotal < c.minSubtotal)
    return { ok: false, error: `Válido para compras acima de ${brl(c.minSubtotal)}.` };
  return { ok: true, coupon: c };
}

// ---------------- frete (estimativa demonstrativa) ----------------
export type ShippingOption = { id: string; label: string; days: string; price: number; carrier?: string };

export const FREE_SHIPPING_FROM = 799;

/** Estimativa por faixa de CEP, usada só quando a Frenet não está configurada (desenvolvimento e testes). */
export function quoteShipping(cep: string, subtotal: number, qty: number): ShippingOption[] | null {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const region = Number(digits[0]);
  // 0-1 SP, 2-3 RJ/ES/MG, 4-5 BA/SE/PE..., 6 Norte/NE, 7 Centro-Oeste, 8-9 Sul
  const zone = [0, 0, 1, 1, 2, 2, 3, 2, 1, 1][region];
  const weight = Math.max(1, Math.ceil(qty * 0.22));
  const pac = round(19.9 + zone * 9 + weight * 2.4);
  const sedex = round(pac * 1.7);
  const free = subtotal >= FREE_SHIPPING_FROM;
  return [
    { id: "pac", label: free ? "Econômico — grátis" : "Econômico", days: `${6 + zone * 2} a ${9 + zone * 2} dias úteis`, price: free ? 0 : pac },
    { id: "sedex", label: "Expresso", days: `${2 + zone} a ${4 + zone} dias úteis`, price: sedex },
    { id: "retirada", label: "Retirar na fábrica", days: "Após aprovação e produção", price: 0 },
  ];
}

// ---------------- totais ----------------
export function totals(lines: CartLine[], coupon?: Coupon | null, shipping?: ShippingOption | null) {
  const subtotal = round(lines.reduce((s, l) => s + lineTotal(l), 0));
  const items = lines.reduce((s, l) => s + lineQuantity(l), 0);
  let discount = 0;
  let ship = shipping?.price ?? 0;
  if (coupon && (!coupon.minSubtotal || subtotal >= coupon.minSubtotal)) {
    if (coupon.type === "percent") discount = round(subtotal * coupon.value);
    if (coupon.type === "fixed") discount = Math.min(coupon.value, subtotal);
    if (coupon.type === "shipping") ship = 0;
  }
  const total = round(Math.max(0, subtotal - discount + ship));
  return { subtotal, items, discount, shipping: ship, total, pixTotal: round(total * 0.95) };
}

/** Pix com 5% de desconto; cartão em até 6x sem juros (parcela mínima R$ 50). */
export const PIX_DISCOUNT = 0.05;
export const maxInstallments = (total: number) => Math.max(1, Math.min(6, Math.floor(total / 50)));

const round = (n: number) => Math.round(n * 100) / 100;
const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

/** Logo de cada posição da linha (com o formato antigo, a mesma logo vale para todas). */
export function lineLogos(l: Pick<CartLine, "positions" | "logos" | "logo">) {
  const out: Partial<Record<Position, { name: string; thumb: string }>> = {};
  for (const p of l.positions) {
    const logo = l.logos?.[p] ?? l.logo;
    if (logo) out[p] = logo;
  }
  return out;
}
