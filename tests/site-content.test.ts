import { test } from "node:test";
import assert from "node:assert/strict";
import { benefitsSchema, defaultBenefits, defaultSiteContent, parseSiteContent } from "../lib/site-content.ts";

test("sem nada gravado, a loja usa a barra padrão, a foto padrão da conta e 1 linha de categorias", () => {
  assert.deepEqual(parseSiteContent([]), defaultSiteContent);
  assert.equal(defaultBenefits.items.length, 4);
  assert.match(defaultBenefits.items[0].text, /^5% de desconto no Pix$/);
  assert.match(defaultBenefits.items[3].text, /799/);
});

test("lê o que o painel gravou", () => {
  const c = parseSiteContent([
    { key: "benefits", data: { active: false, items: [{ icon: "truck", text: "Entrega para todo o Brasil" }] } },
    { key: "account_banner", data: { image: "https://abc123.public.blob.vercel-storage.com/banners/conta.webp" } },
    { key: "category_rows", data: { rows: 2 } },
  ]);
  assert.equal(c.benefits.active, false);
  assert.equal(c.benefits.items[0].text, "Entrega para todo o Brasil");
  assert.equal(c.accountBanner, "https://abc123.public.blob.vercel-storage.com/banners/conta.webp");
  assert.equal(c.categoryRows, 2);
});

test("valor inválido no banco volta para o padrão (sem quebrar a home)", () => {
  const c = parseSiteContent([
    { key: "benefits", data: { active: true, items: [{ icon: "foguete", text: "x" }] } },
    { key: "account_banner", data: { image: "javascript:alert(1)" } },
    { key: "category_rows", data: { rows: 3 } },
  ]);
  assert.deepEqual(c, defaultSiteContent);
});

test("barra: no máximo 6 itens e texto curto", () => {
  const item = { icon: "star", text: "Item" } as const;
  assert.equal(benefitsSchema.safeParse({ active: true, items: Array(7).fill(item) }).success, false);
  assert.equal(benefitsSchema.safeParse({ active: true, items: [{ icon: "star", text: "x".repeat(49) }] }).success, false);
  assert.equal(benefitsSchema.safeParse({ active: true, items: [{ icon: "star", text: "  Compra segura  " }] }).data?.items[0].text, "Compra segura");
});
