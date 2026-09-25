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
test("projetos antigos recebem acabamentos desligados sem perder a arte", () => {
  const { garment, ...old } = newDesign(products[0]);
  const restored = designSchema.parse(old);
  assert.equal(restored.garment.collarEnabled, false);
  assert.equal(restored.garment.sleevesEnabled, false);
  assert.equal(restored.front, old.front);
});
test("acabamentos e tecido sobrevivem à persistência e rejeitam opções inválidas", () => {
  const design = newDesign(products[0]);
  design.garment = {
    ...design.garment,
    collarEnabled: true,
    sleevesEnabled: true,
    fabric: "pique",
    sleeveDetail: "cuff",
  };
  assert.deepEqual(
    designSchema.parse(JSON.parse(JSON.stringify(design))).garment,
    design.garment,
  );
  assert.equal(
    designSchema.safeParse({
      ...design,
      garment: { ...design.garment, fabric: "invalid" },
    }).success,
    false,
  );
});
