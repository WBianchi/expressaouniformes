import { test } from "node:test";
import assert from "node:assert/strict";
import { cartLineSchema } from "../lib/validation.ts";
import { lineTotal, quoteShipping, totals, unitPrice, validateCoupon, type CartLine } from "../lib/pricing.ts";

const line = (patch: Partial<CartLine> = {}): CartLine => ({
  id: "a",
  slug: "polo-pv-basica",
  color: "marinho",
  sizes: { M: 5, G: 5 },
  positions: ["frente"],
  ...patch,
});

test("preço unitário soma posições e aplica desconto por volume", () => {
  assert.equal(unitPrice(line()), 44.8); // 37,90 + 6,90
  assert.equal(unitPrice(line({ sizes: { M: 20 } })), 42.56); // -5%
  assert.equal(unitPrice(line({ sizes: { M: 100 }, positions: [] })), 32.21); // -15%
  assert.equal(lineTotal(line()), 448);
});

test("valida mínimo, cor, tamanho e produto sob medida", () => {
  assert.ok(cartLineSchema.safeParse(line()).success);
  assert.ok(!cartLineSchema.safeParse(line({ sizes: { M: 4 } })).success);
  assert.ok(!cartLineSchema.safeParse(line({ color: "limao" })).success);
  assert.ok(!cartLineSchema.safeParse(line({ sizes: { PP: 10 } })).success);
  assert.ok(!cartLineSchema.safeParse(line({ slug: "polo-com-friso" })).success);
  assert.ok(!cartLineSchema.safeParse(line({ sizes: { M: -5, G: 15 } })).success);
});

test("cupons respeitam valor mínimo", () => {
  assert.ok(!validateCoupon("empresa50", 100).ok);
  assert.ok(validateCoupon(" empresa50 ", 600).ok);
  assert.ok(!validateCoupon("XPTO", 1000).ok);
});

test("totais com cupom percentual e frete", () => {
  const ship = quoteShipping("01310-100", 448, 10)!;
  assert.equal(ship.length, 3);
  const c = validateCoupon("BEMVINDO10", 448);
  assert.ok(c.ok);
  const t = totals([line()], c.ok ? c.coupon : null, ship[0]);
  assert.equal(t.subtotal, 448);
  assert.equal(t.discount, 44.8);
  assert.equal(t.total, Math.round((448 - 44.8 + ship[0].price) * 100) / 100);
  assert.equal(quoteShipping("123", 0, 1), null);
});

test("frete econômico grátis acima do limite", () => {
  assert.equal(quoteShipping("90000000", 900, 30)![0].price, 0);
});
