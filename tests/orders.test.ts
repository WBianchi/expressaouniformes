import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkoutRequestSchema,
  computeQuote,
  detectBrand,
  isValidCnpj,
  isValidCpf,
  luhn,
  newOrderId,
  nextPaymentStatus,
  ORDER_ID_RE,
  parseExpiry,
  paymentStatusFromAsaas,
  paymentStatusFromEvent,
  toStoredOrder,
  publicQuote,
} from "../lib/orders.ts";
import type { CartLine } from "../lib/pricing.ts";

const line = (patch: Partial<CartLine> = {}): CartLine => ({
  id: "a",
  slug: "polo-pv-basica",
  color: "marinho",
  sizes: { M: 5, G: 5 },
  positions: ["frente"],
  ...patch,
});

test("documentos e cartão", () => {
  assert.ok(isValidCpf("529.982.247-25"));
  assert.ok(!isValidCpf("111.111.111-11"));
  assert.ok(!isValidCpf("529.982.247-26"));
  assert.ok(isValidCnpj("11.222.333/0001-81"));
  assert.ok(!isValidCnpj("11.222.333/0001-80"));
  assert.ok(luhn("4111 1111 1111 1111"));
  assert.ok(!luhn("4111 1111 1111 1112"));
  assert.equal(detectBrand("4111111111111111"), "visa");
  assert.equal(detectBrand("5555555555554444"), "mastercard");
  assert.equal(detectBrand("378282246310005"), "amex");
  assert.equal(detectBrand("6362970000457013"), "elo");
  const now = new Date(2026, 9, 9);
  assert.deepEqual(parseExpiry("12/30", now), { month: "12", year: "2030" });
  assert.equal(parseExpiry("10/26", now)?.year, "2026"); // mês corrente (outubro) ainda válido
  assert.equal(parseExpiry("09/26", now), null);
  assert.equal(parseExpiry("13/30", now), null);
});

test("recalcula o pedido no servidor: Pix com 5%, parcelas e frete", () => {
  const pix = computeQuote({ lines: [line()], cep: "01310-100", shippingId: "pac", method: "pix" });
  assert.ok(pix.ok);
  if (!pix.ok) return;
  assert.equal(pix.quote.subtotal, 448);
  assert.equal(pix.quote.chargeTotal, Math.round(pix.quote.total * 0.95 * 100) / 100);
  assert.ok(pix.quote.pixDiscount > 0);

  const card = computeQuote({ lines: [line()], cep: "01310-100", shippingId: "retirada", method: "cartao", installments: 6 });
  assert.ok(card.ok && card.quote.installments === 6 && card.quote.chargeTotal === 448);

  const tooMany = computeQuote({ lines: [line()], cep: "01310-100", shippingId: "pac", method: "cartao", installments: 12 });
  assert.ok(!tooMany.ok);

  assert.ok(!computeQuote({ lines: [line()], cep: "123", shippingId: "pac", method: "pix" }).ok);
  assert.ok(!computeQuote({ lines: [line()], cep: "01310-100", shippingId: "pac", method: "pix", coupon: "XPTO" }).ok);
  const cup = computeQuote({ lines: [line()], cep: "01310-100", shippingId: "retirada", method: "boleto", coupon: "bemvindo10" });
  assert.ok(cup.ok && cup.quote.discount === 44.8 && cup.quote.chargeTotal === 403.2);
});

test("esquema do checkout rejeita CPF inválido e aceita pedido válido", () => {
  const base = {
    idempotencyKey: "0f8fad5b-d9cb-469f-a165-70867728950e",
    customer: { type: "pf", name: "Cliente Teste", document: "529.982.247-25", email: "cliente@example.com", phone: "(11) 98888-7777" },
    address: { cep: "01310-100", street: "Av. Paulista", number: "1000", district: "Bela Vista", city: "São Paulo", state: "sp" },
    lines: [line()],
    shippingId: "pac",
    payment: { method: "pix" },
  };
  const ok = checkoutRequestSchema.safeParse(base);
  assert.ok(ok.success);
  assert.equal(ok.success && ok.data.address.state, "SP");
  assert.ok(!checkoutRequestSchema.safeParse({ ...base, customer: { ...base.customer, document: "111.111.111-11" } }).success);
  assert.ok(!checkoutRequestSchema.safeParse({ ...base, customer: { ...base.customer, type: "pj", document: "11.222.333/0001-81" } }).success); // PJ sem razão social
});

test("status de pagamento e webhooks não regridem", () => {
  assert.equal(paymentStatusFromAsaas("CONFIRMED"), "pago");
  assert.equal(paymentStatusFromAsaas("PENDING"), "pendente");
  assert.equal(paymentStatusFromEvent("PAYMENT_RECEIVED"), "pago");
  assert.equal(paymentStatusFromEvent("PAYMENT_OVERDUE"), "vencido");
  assert.equal(paymentStatusFromEvent("PAYMENT_BANK_SLIP_VIEWED"), null);
  assert.equal(nextPaymentStatus("pago", "vencido"), "pago");
  assert.equal(nextPaymentStatus("pago", "estornado"), "estornado");
  assert.equal(nextPaymentStatus("pendente", "pago"), "pago");
});

test("id do pedido e formato salvo em eu-orders", () => {
  const id = newOrderId(new Date(2026, 9, 9));
  assert.match(id, ORDER_ID_RE);
  assert.ok(id.startsWith("EU-261009-"));
  const q = computeQuote({ lines: [line({ logo: { name: "logo.png", thumb: "data:image/png;base64,AAA" } })], cep: "01310-100", shippingId: "pac", method: "pix" });
  assert.ok(q.ok);
  if (!q.ok) return;
  const pub = publicQuote(q.quote);
  assert.ok(!("logo" in pub.lines[0]));
  const stored = toStoredOrder({
    orderId: id,
    demo: false,
    createdAt: "2026-10-09T12:00:00.000Z",
    status: "aguardando_pagamento",
    quote: pub,
    payment: { id: "pay_1", method: "pix", status: "pendente", invoiceUrl: "https://example.com" },
  });
  assert.deepEqual(stored.items, [{ slug: "polo-pv-basica", name: "Polo PV Básica", qty: 10, color: "marinho" }]);
  assert.equal(stored.layout?.status, "aguardando");
  assert.equal(stored.total, q.quote.chargeTotal);
});
