import { test } from "node:test";
import assert from "node:assert/strict";
import { applyListings, getProduct, withListing } from "../lib/catalog.ts";
import { cleanColorPhotos, listingDiff, listingFieldsOf, listingFormSchema, listingOverrideSchema } from "../lib/listing.ts";
import { unitPrice } from "../lib/pricing.ts";
import { cartLineSchema } from "../lib/validation.ts";
import { adjustmentMessage, artPath, customerWhatsapp, isArtUrl } from "../lib/art.ts";

const SLUG = "camiseta-malha-pv";

test("anúncio editado vale para o catálogo inteiro e para o preço cobrado", () => {
  const original = withListing(SLUG, undefined)!;
  const sizes = { M: 5, G: 5 };
  const before = unitPrice({ slug: SLUG, positions: [], sizes });
  try {
    applyListings({ [SLUG]: { name: "Camiseta Nova", price: 30, compareAt: null, sizes: ["M", "G"] } });
    const p = getProduct(SLUG)!;
    assert.equal(p.name, "Camiseta Nova");
    assert.equal(p.price, 30);
    assert.equal(p.compareAt, undefined);
    assert.deepEqual(p.sizes, ["M", "G"]);
    // campos não editados continuam vindo do código
    assert.equal(p.description, original.description);
    // o servidor recalcula o pedido com o preço novo
    assert.equal(unitPrice({ slug: SLUG, positions: [], sizes }), 30);
    // tamanho tirado do anúncio deixa de ser aceito no carrinho
    const line = { id: "a", slug: SLUG, color: p.colors[0], sizes: { P: 5 }, positions: [] };
    assert.equal(cartLineSchema.safeParse(line).success, false);
  } finally {
    applyListings({});
  }
  const back = getProduct(SLUG)!;
  assert.equal(back.name, original.name);
  assert.equal(back.compareAt, original.compareAt);
  assert.equal(unitPrice({ slug: SLUG, positions: [], sizes }), before);
});

test("só o que mudou é gravado", () => {
  const base = listingFieldsOf(withListing(SLUG, undefined)!);
  assert.deepEqual(listingDiff(base, { ...base }), {});
  assert.deepEqual(listingDiff(base, { ...base, price: 27.5, highlights: [] }), { price: 27.5, highlights: [] });
});

test("formulário do anúncio valida preço \"de\", cores e técnicas", () => {
  const { colorPhotos: _ignored, ...form } = listingFieldsOf(withListing(SLUG, undefined)!);
  assert.ok(listingFormSchema.safeParse(form).success);
  assert.equal(listingFormSchema.safeParse({ ...form, compareAt: form.price }).success, false);
  assert.equal(listingFormSchema.safeParse({ ...form, colors: ["preto", "preto"] }).success, false);
  assert.equal(listingFormSchema.safeParse({ ...form, colors: ["cor-que-nao-existe"] }).success, false);
  assert.equal(listingFormSchema.safeParse({ ...form, techniques: [] }).success, false);
});

test("edição gravada com cor que saiu da paleta é aproveitada sem ela", () => {
  const r = listingOverrideSchema.safeParse({ colors: ["preto", "cor-antiga"] });
  assert.ok(r.success);
  assert.deepEqual(r.data.colors, ["preto"]);
  assert.equal(listingOverrideSchema.safeParse({ colorPhotos: { preto: ["javascript:alert(1)"] } }).success, false);
  assert.deepEqual(cleanColorPhotos({ preto: ["", ""], branco: ["", "/images/x.webp"] }), { branco: ["", "/images/x.webp"] });
});

test("arquivo original da logo: só do Blob do site, na pasta artes", () => {
  const ok = "https://abc123.public.blob.vercel-storage.com/artes/logo-empresa-Xy12AbCd.png";
  assert.ok(isArtUrl(ok));
  assert.ok(!isArtUrl("https://evil.example.com/artes/logo.png"));
  assert.ok(!isArtUrl("https://abc123.public.blob.vercel-storage.com/banners/x.png"));
  assert.equal(artPath("Logo Açaí FINAL (2).PNG", "image/png"), "artes/logo-acai-final-2.png");
  assert.equal(artPath("arquivo", "image/svg+xml"), "artes/arquivo.svg");
  const p = getProduct(SLUG)!;
  const line = (url: string) => ({
    id: "a",
    slug: SLUG,
    color: p.colors[0],
    sizes: { M: 5 },
    positions: ["frente"],
    logos: { frente: { name: "logo.png", thumb: "data:image/png;base64,AAAA", url } },
  });
  assert.ok(cartLineSchema.safeParse(line(ok)).success);
  assert.equal(cartLineSchema.safeParse(line("https://evil.example.com/x.png")).success, false);
});

test("pedido de ajuste abre o WhatsApp do cliente com a mensagem pronta", () => {
  const link = customerWhatsapp("(11) 98765-4321", "oi")!;
  assert.ok(link.startsWith("https://wa.me/5511987654321?text="));
  assert.equal(customerWhatsapp("123", "oi"), null);
  const msg = adjustmentMessage({ name: "Maria Souza", orderId: "EU-261116-ABCDE", note: "Envie em PNG com fundo transparente." });
  assert.ok(msg.includes("Maria"));
  assert.ok(msg.includes("EU-261116-ABCDE"));
  assert.ok(msg.includes("PNG com fundo transparente"));
});
