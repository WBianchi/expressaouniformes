import { test } from "node:test";
import assert from "node:assert/strict";
import { applyCatalogEdits, categories, getCategory, getProduct, NO_EDITS, products, stockProducts, withListing } from "../lib/catalog.ts";
import { cleanColorPhotos, galleryPhotosSchema, listingDiff, listingFieldsOf, listingFormOf, listingFormSchema, listingOverrideSchema, MAX_PHOTOS, photosOverLimit } from "../lib/listing.ts";
import { unitPrice } from "../lib/pricing.ts";
import { cartLineSchema } from "../lib/validation.ts";
import { adjustmentMessage, artPath, customerWhatsapp, isArtUrl } from "../lib/art.ts";

const SLUG = "camiseta-malha-pv";

test("anúncio editado vale para o catálogo inteiro e para o preço cobrado", () => {
  const original = withListing(SLUG, undefined)!;
  const sizes = { M: 5, G: 5 };
  const before = unitPrice({ slug: SLUG, positions: [], sizes });
  try {
    applyCatalogEdits({ ...NO_EDITS, listings: { [SLUG]: { name: "Camiseta Nova", price: 30, compareAt: null, sizes: ["M", "G"] } } });
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
    applyCatalogEdits(NO_EDITS);
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
  const form = listingFormOf(withListing(SLUG, undefined)!);
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

test("categoria renomeada e criada no painel: os produtos continuam ligados", () => {
  try {
    applyCatalogEdits({ ...NO_EDITS, categories: { camisetas: { name: "Camisetas Premium" }, escolar: { name: "Uniforme escolar", created: true } } });
    assert.equal(getCategory("camisetas")?.name, "Camisetas Premium");
    assert.equal(getProduct(SLUG)?.category, "camisetas");
    assert.equal(getCategory("escolar")?.name, "Uniforme escolar");
    assert.equal(categories.at(-1)?.slug, "escolar");
    // produto movido para a categoria nova
    applyCatalogEdits({
      ...NO_EDITS,
      categories: { escolar: { name: "Uniforme escolar", created: true } },
      listings: { [SLUG]: { category: "escolar" } },
    });
    assert.equal(getProduct(SLUG)?.category, "escolar");
    // categoria apagada: o produto volta para a de origem
    applyCatalogEdits({ ...NO_EDITS, listings: { [SLUG]: { category: "escolar" } } });
    assert.equal(getCategory("escolar"), undefined);
    assert.equal(getProduct(SLUG)?.category, "camisetas");
  } finally {
    applyCatalogEdits(NO_EDITS);
  }
  assert.equal(getCategory("camisetas")?.name, "Camisetas");
});

test("anúncio cadastrado no painel: rascunho fica fora da loja; publicado entra com galeria e preço", () => {
  const total = products.length;
  try {
    const created = { "polo-dry": { name: "Polo Dry", kind: "stock" as const, category: "polos", published: false } };
    applyCatalogEdits({ ...NO_EDITS, created });
    assert.equal(getProduct("polo-dry"), undefined);
    assert.ok(withListing("polo-dry", undefined));
    applyCatalogEdits({
      ...NO_EDITS,
      created: { "polo-dry": { ...created["polo-dry"], published: true } },
      listings: { "polo-dry": { price: 39.9, description: "Polo leve.", photos: ["/images/a.webp", "/images/b.webp"] } },
    });
    const p = getProduct("polo-dry")!;
    assert.equal(products.length, total + 1);
    assert.ok(stockProducts.includes(p));
    assert.equal(p.price, 39.9);
    assert.deepEqual(p.photos, ["/images/a.webp", "/images/b.webp"]);
    // sem foto da peça, a capa faz as vezes da peça
    assert.equal(p.image, "/images/a.webp");
  } finally {
    applyCatalogEdits(NO_EDITS);
  }
  assert.equal(products.length, total);
  assert.equal(getProduct("polo-dry"), undefined);
});

test("galeria: ao menos a capa, sem repetir e só imagens do site ou do Blob", () => {
  assert.ok(galleryPhotosSchema.safeParse(["/images/a.webp", "https://abc.public.blob.vercel-storage.com/produtos/x.webp"]).success);
  assert.equal(galleryPhotosSchema.safeParse([]).success, false);
  assert.equal(galleryPhotosSchema.safeParse(["/images/a.webp", "/images/a.webp"]).success, false);
  assert.equal(galleryPhotosSchema.safeParse(["https://evil.example.com/x.webp"]).success, false);
});

test("galeria: até 15 fotos em cada cor (e 15 sem cor), não 15 no anúncio inteiro", () => {
  const urls = (cor: string, n: number) => Array.from({ length: n }, (_, i) => `/images/${cor}-${i}.webp`);
  const laranja = urls("laranja", MAX_PHOTOS);
  const branco = urls("branco", MAX_PHOTOS);
  const semCor = urls("medidas", MAX_PHOTOS);
  const tags = Object.fromEntries([...laranja.map((u) => [u, "laranja"]), ...branco.map((u) => [u, "branco"])]);
  const all = [...laranja, ...branco, ...semCor];
  assert.ok(galleryPhotosSchema.safeParse(all).success);
  assert.equal(photosOverLimit(all, tags), null);
  // as 45 fotos continuam válidas quando o anúncio é lido do banco
  assert.ok(listingOverrideSchema.safeParse({ photos: all, photoColors: tags }).success);
  const extra = "/images/laranja-extra.webp";
  assert.match(photosOverLimit([...all, extra], { ...tags, [extra]: "laranja" }, () => "Laranja") ?? "", /na cor Laranja \(tem 16\)/);
  assert.match(photosOverLimit([...all, extra], tags) ?? "", /Todas as cores \(tem 16\)/);
});

test("preço da personalização: tabela única do simulador, por técnica e posição", async () => {
  const { feeFor, positionFees } = await import("../lib/catalog.ts");
  const sizes = { M: 10 };
  try {
    applyCatalogEdits({ ...NO_EDITS, listings: { [SLUG]: { price: 20 } }, fees: { Bordado: { frente: 9, costas: 15 }, Silk: { frente: 4 } } });
    const p = getProduct(SLUG)!;
    assert.equal(feeFor(p, "Bordado", "frente"), 9);
    assert.equal(feeFor(p, "Silk", "frente"), 4);
    // vale para qualquer peça
    assert.equal(feeFor(getProduct("calca-brim-elastico-total")!, "Bordado", "costas"), 15);
    // posição sem preço na tabela usa a taxa padrão
    assert.equal(feeFor(p, "Silk", "costas"), positionFees.costas.fee);
    assert.equal(unitPrice({ slug: SLUG, positions: ["frente", "costas"], sizes, technique: "Bordado" }), 20 + 9 + 15);
    assert.equal(unitPrice({ slug: SLUG, positions: ["frente"], sizes, technique: "Silk" }), 24);
    // sem técnica escolhida: preço da primeira técnica do anúncio
    assert.equal(unitPrice({ slug: SLUG, positions: ["frente"], sizes }), 20 + feeFor(p, p.techniques[0], "frente"));
  } finally {
    applyCatalogEdits(NO_EDITS);
  }
  assert.equal(feeFor(getProduct(SLUG)!, "Bordado", "frente"), positionFees.frente.fee);
});

test("bordado nas costas: logo até 27 cm (não fica presa em 5 cm de altura)", async () => {
  const { logoSpots, maxLogoCm } = await import("../lib/mockup.ts");
  const silk = logoSpots(getProduct(SLUG)!, "Silk").costas!;
  const bordado = logoSpots(getProduct(SLUG)!, "Bordado").costas!;
  assert.equal(maxLogoCm(silk, 1), 28);
  assert.equal(maxLogoCm(bordado, 1), 27); // logo quadrada: 27 × 27 cm
  assert.equal(maxLogoCm(bordado, 10), 27); // logo bem larga: até 27 cm
  assert.equal(maxLogoCm(bordado, 0.5), 13.5); // logo alta: 27 cm de altura
  assert.equal(logoSpots(getProduct(SLUG)!, "Bordado").frente!.cap, undefined);
});

test("as duas mangas usam o preço da manga da tabela do simulador", async () => {
  const { feeFor, positionFees } = await import("../lib/catalog.ts");
  try {
    applyCatalogEdits({ ...NO_EDITS, fees: { Bordado: { manga: 9.5 } } });
    assert.equal(feeFor(getProduct(SLUG)!, "Bordado", "manga"), 9.5);
    assert.equal(feeFor(getProduct(SLUG)!, "Bordado", "manga-direita"), 9.5);
  } finally {
    applyCatalogEdits(NO_EDITS);
  }
  assert.equal(feeFor(getProduct(SLUG)!, "Bordado", "manga-direita"), positionFees["manga-direita"].fee);
});

test("ficha técnica: texto editado, linha escondida e linhas extras", async () => {
  const { specRows } = await import("../lib/specs.ts");
  try {
    applyCatalogEdits({
      ...NO_EDITS,
      listings: { [SLUG]: { specs: { grade: "", cuidados: "Lavar à mão." }, extraSpecs: [{ label: "Gramatura", value: "160 g/m²" }] } },
    });
    const rows = Object.fromEntries(specRows(getProduct(SLUG)!));
    assert.equal(rows["Grade"], undefined);
    assert.equal(rows["Cuidados"], "Lavar à mão.");
    assert.equal(rows["Gramatura"], "160 g/m²");
    assert.ok(rows["Fabricante"]);
  } finally {
    applyCatalogEdits(NO_EDITS);
  }
  const form = listingFormOf(withListing(SLUG, undefined)!);
  const { feesSchema } = await import("../lib/listing.ts");
  assert.equal(feesSchema.safeParse({ Bordado: { frente: -1 } }).success, false);
  assert.equal(listingFormSchema.safeParse({ ...form, extraSpecs: [{ label: "", value: "x" }] }).success, false);
});

test("salvar e reabrir: a mesma ficha com as chaves em outra ordem (como volta do banco) não conta como mudança", async () => {
  const { sameData } = await import("../lib/listing.ts");
  const form = { specs: { posicoes: "Frente", disponibilidade: "Pronta", cuidados: "." }, highlights: [{ title: "A", text: "B" }], description: "Texto " };
  const fromDb = { description: "Texto", highlights: [{ text: "B", title: "A" }], specs: { cuidados: ".", posicoes: "Frente", disponibilidade: "Pronta" } };
  assert.ok(sameData(form, fromDb));
  assert.ok(!sameData(form, { ...fromDb, specs: { ...fromDb.specs, cuidados: "Lavar à mão." } }));
  // o servidor também não grava campo igual ao original só porque as chaves vieram em outra ordem
  const base = listingFieldsOf(withListing(SLUG, undefined)!);
  const reordered = base.highlights.map((h) => ({ text: h.text, title: h.title }));
  assert.deepEqual(listingDiff(base, { ...base, highlights: reordered }), {});
});

test("galeria com mais de 2 fotos: os mockups da peça não tomam o lugar das fotos do anúncio", async () => {
  const { withPhotos } = await import("../lib/product-media.ts");
  const p = { image: "/peca.webp", back: "/costas.webp", side: "/lado.webp", photos: ["/1.webp", "/2.webp", "/3.webp", "/4.webp", "/5.webp", "/6.webp"] };
  const out = withPhotos(p, [null, null, "/mock-frente.png", "/mock-costas.png", "/mock-lado.png"]);
  assert.deepEqual(out.photos, p.photos);
  assert.equal(out.image, "/mock-frente.png");
  assert.equal(out.side, "/mock-lado.png");
  // fotos antigas de vitrine (posições 0 e 1) continuam valendo
  assert.equal(withPhotos(p, ["/vitrine.png"]).photos![0], "/vitrine.png");
});

test("fotos por cor: até 5 por cor (vestindo e peça), sem cor vazia e sem vazio no fim", async () => {
  const { cleanColorPhotos, colorModelPhotos, listingOverrideSchema } = await import("../lib/listing.ts");
  const peca = "/images/products/camiseta-malha-pv.webp";
  // só a foto da frente da peça laranja: as posições de antes ficam vazias, para não mudar de lugar
  assert.deepEqual(cleanColorPhotos({ laranja: ["", "", peca, "", ""], royal: ["", ""] }), { laranja: ["", "", peca] });
  assert.ok(listingOverrideSchema.safeParse({ colorPhotos: { laranja: ["", "", peca, peca, peca] } }).success);
  assert.ok(!listingOverrideSchema.safeParse({ colorPhotos: { laranja: ["", "", peca, peca, peca, peca] } }).success);
  // a página do produto usa só as fotos vestindo da cor
  assert.deepEqual(colorModelPhotos(["", "", peca]), []);
  assert.deepEqual(colorModelPhotos([peca, "", peca]), [peca]);
});

test("promoção: % de desconto do preço riscado (de 57,90 por 46,90 = 19% OFF)", async () => {
  const { offPercent } = await import("../lib/pricing.ts");
  assert.equal(offPercent(46.9, 57.9), 19);
  assert.equal(offPercent(24.9, 29.9), 17);
  assert.equal(offPercent(46.9, undefined), 0);
  assert.equal(offPercent(46.9, 40), 0);
});

test("cor de cada foto da galeria: só cores da paleta e fotos válidas", async () => {
  const { listingOverrideSchema, listingFormOf } = await import("../lib/listing.ts");
  const foto = "/images/products/camiseta-malha-pv.webp";
  assert.ok(listingOverrideSchema.safeParse({ photoColors: { [foto]: "laranja" } }).success);
  assert.ok(!listingOverrideSchema.safeParse({ photoColors: { [foto]: "cor-que-nao-existe" } }).success);
  assert.ok(!listingOverrideSchema.safeParse({ photoColors: { "javascript:alert(1)": "laranja" } }).success);
  // a marcação tem botão próprio (galeria): não entra no formulário do anúncio
  assert.ok(!("photoColors" in listingFormOf(getProduct(SLUG)!)));
});
