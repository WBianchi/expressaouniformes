import { test } from "node:test";
import assert from "node:assert/strict";
import {
  designSchema,
  cartItemSchema,
  localStoreSchema,
} from "../lib/design-validation.ts";
import { newDesign, products, quantity } from "../lib/catalog.ts";
test("a distribuição da grade define a quantidade comprada", () => {
  const d = newDesign(products[0]);
  assert.equal(quantity(d.sizes), 30);
  assert.equal(
    cartItemSchema.safeParse({
      id: "test",
      productId: d.productId,
      design: d,
      quantity: 30,
    }).success,
    true,
  );
});
test("rejeita pedido abaixo do mínimo e quantidade adulterada", () => {
  const d = newDesign(products[0]);
  assert.equal(
    cartItemSchema.safeParse({
      id: "test",
      productId: d.productId,
      design: d,
      quantity: 29,
    }).success,
    false,
  );
  assert.equal(
    cartItemSchema.safeParse({
      id: "test",
      productId: d.productId,
      design: d,
      quantity: 100,
    }).success,
    false,
  );
});
test("rejeita modelo divergente entre item e personalização", () => {
  const d = newDesign(products[0]);
  assert.equal(
    cartItemSchema.safeParse({
      id: "test",
      productId: products[1].id,
      design: d,
      quantity: 30,
    }).success,
    false,
  );
});
test("rejeita contagens negativas, fracionárias e infinitas", () => {
  for (const n of [-1, 1.5, Infinity, NaN]) {
    const d = newDesign(products[0]);
    d.sizes.P = n;
    assert.equal(designSchema.safeParse(d).success, false);
  }
});
test("rejeita persistência inválida sem quebrar hidratação", () => {
  assert.equal(
    localStoreSchema.safeParse({ cart: [{ id: "bad" }] }).success,
    false,
  );
  assert.equal(localStoreSchema.safeParse({}).success, true);
});
test("rejeita previews remotos e produto desconhecido", () => {
  const d = newDesign(products[0]);
  assert.equal(
    designSchema.safeParse({
      ...d,
      frontImage: "https://example.com/track.png",
    }).success,
    false,
  );
  assert.equal(
    designSchema.safeParse({ ...d, productId: "unknown" }).success,
    false,
  );
});
