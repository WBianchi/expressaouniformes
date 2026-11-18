import { test } from "node:test";
import assert from "node:assert/strict";
import { lineLogos } from "../lib/pricing.ts";
import { areaCm, clampPlacement, defaultPlacement, isPlacement, logoBox, logoSpots, maxLogoCm } from "../lib/mockup.ts";
import { emptyCompany, quoteRequestMessage } from "../lib/quote-message.ts";
import { cartLineSchema } from "../lib/validation.ts";

const a = { name: "frente.png", thumb: "data:image/png;base64,AA" };
const b = { name: "costas.png", thumb: "data:image/png;base64,BB" };

test("cada posição usa a própria logo", () => {
  const logos = lineLogos({ positions: ["frente", "costas"], logos: { frente: a, costas: b } });
  assert.deepEqual(logos, { frente: a, costas: b });
});

test("logo de posição desmarcada não entra", () => {
  assert.deepEqual(lineLogos({ positions: ["frente"], logos: { frente: a, costas: b } }), { frente: a });
});

test("carrinho antigo (uma logo) vale para todas as posições", () => {
  assert.deepEqual(lineLogos({ positions: ["frente", "manga"], logo: a }), { frente: a, manga: a });
});

test("checkout aceita logos por posição", () => {
  const r = cartLineSchema.safeParse({
    id: "x",
    slug: "camiseta-malha-pv",
    color: "marinho",
    sizes: { M: 10 },
    positions: ["frente", "costas"],
    logos: { frente: a, costas: b },
  });
  assert.equal(r.success, true);
});

test("mensagem do orçamento lista a logo de cada posição", () => {
  const msg = quoteRequestMessage(
    [{ slug: "camiseta-malha-pv", color: "marinho", qty: 30, positions: ["frente", "costas"] }],
    { ...emptyCompany, name: "Empresa", contact: "Ana", phone: "11", email: "a@b.c", city: "SP" },
    { frente: "frente.png" },
  );
  assert.match(msg, /Frente \(peito\): frente\.png/);
  assert.match(msg, /Costas[^:]*: envio nesta conversa/);
});

const camiseta = { category: "camisetas", slug: "camiseta-malha-pv" };
const inside = (box: ReturnType<typeof logoBox>, area: { x0: number; x1: number; y0: number; y1: number }) =>
  box.x - box.wPct / 2 >= area.x0 - 1e-9 && box.x + box.wPct / 2 <= area.x1 + 1e-9 && box.y - box.hPct / 2 >= area.y0 - 1e-9 && box.y + box.hPct / 2 <= area.y1 + 1e-9;

test("cada posição tem a área real da ficha: peito 10 × 10, costas 28 × 35, manga 8 × 8 cm", () => {
  const spots = logoSpots(camiseta);
  const cm = (pos: "frente" | "costas" | "manga") => Object.values(areaCm(spots[pos]!)).map(Math.round);
  assert.deepEqual(cm("frente"), [10, 10]);
  assert.deepEqual(cm("costas"), [28, 35]);
  assert.deepEqual(cm("manga"), [8, 8]);
});

test("logo nova entra centralizada na área, num tamanho que cabe", () => {
  const spot = logoSpots(camiseta).frente!;
  for (const aspect of [1, 3, 0.4]) {
    const p = defaultPlacement(spot, aspect);
    assert.equal(p.x, (spot.area.x0 + spot.area.x1) / 2);
    assert.equal(p.y, (spot.area.y0 + spot.area.y1) / 2);
    assert.ok(inside(logoBox(spot, p, aspect), spot.area));
    assert.ok(p.w <= maxLogoCm(spot, aspect));
  }
});

test("tamanho em cm mantém a proporção da logo e respeita o máximo da posição", () => {
  const spot = logoSpots(camiseta).frente!;
  const box = logoBox(spot, { x: 50, y: 50, w: 8 }, 2);
  assert.equal(box.w, 8);
  assert.equal(box.hCm, 4);
  assert.ok(Math.abs(box.wPct / box.hPct - 2) < 1e-9);
  assert.equal(clampPlacement({ x: 0, y: 0, w: 400 }, spot, 2).w, maxLogoCm(spot, 2));
  // tamanho livre: a logo do peito pode virar estampa grande na frente, até 28 × 35 cm
  assert.equal(maxLogoCm(spot, 2), 28);
  // logo alta (1:2): a altura limita, até 17,5 cm de largura (35 de altura)
  assert.equal(maxLogoCm(spot, 0.5), 17.5);
  assert.equal(maxLogoCm(logoSpots(camiseta).manga!, 1), 10);
});

test("a logo inteira fica dentro da vista (e a da manga perto da manga), mesmo no tamanho máximo", () => {
  const spots = logoSpots(camiseta);
  for (const pos of ["frente", "costas", "manga"] as const) {
    const spot = spots[pos]!;
    for (const [x, y] of [
      [-50, -50],
      [150, 150],
      [0, 100],
      [100, 0],
    ])
      for (const aspect of [1, 2.5, 0.5]) {
        const p = clampPlacement({ x, y, w: 1000 }, spot, aspect);
        assert.ok(inside(logoBox(spot, p, aspect), spot.bounds), `${pos} ${x},${y} ${aspect}`);
      }
  }
});

test("posição salva no formato antigo (escala) continua valendo", () => {
  const spot = logoSpots(camiseta).frente!;
  const old = clampPlacement({ x: 61, y: 31, s: 1 }, spot, 1);
  assert.equal(old.w, defaultPlacement(spot, 1).w);
  assert.ok(isPlacement({ x: 50, y: 50, s: 1 }));
  assert.ok(isPlacement({ x: 50, y: 50, w: 8 }));
  assert.ok(!isPlacement({ x: 50, y: 50 }));
});

test("manga aparece na vista lateral", () => {
  assert.equal(logoSpots(camiseta).manga?.view, "side");
  assert.equal(logoSpots({ category: "calcas" }).manga, undefined);
});

test("manga direita: a foto de lado espelhada, com a logo no mesmo lugar do outro lado", async () => {
  const { availablePositions, flipFits } = await import("../lib/mockup.ts");
  const spots = logoSpots(camiseta);
  const left = spots.manga!;
  const right = spots["manga-direita"]!;
  assert.equal(right.view, "side-flip");
  assert.equal(right.x, 100 - left.x);
  assert.equal(right.y, left.y);
  assert.deepEqual([right.area.x0, right.area.x1], [100 - left.area.x1, 100 - left.area.x0]);
  assert.deepEqual(right.max, left.max);
  assert.deepEqual(availablePositions(camiseta), ["frente", "costas", "manga", "manga-direita"]);
  // peça sem manga (calça): nenhuma das duas
  assert.deepEqual(availablePositions({ category: "calcas" }), ["frente", "costas"]);
  // foto virada para a direita: ela é a manga direita; a esquerda é a espelhada
  const fem = logoSpots({ category: "camisas", slug: "camisa-social-feminina-manga-longa" });
  assert.equal(fem["manga-direita"]!.view, "side");
  assert.equal(fem.manga!.view, "side-flip");
  // contorno espelhado: o que cabe à esquerda na foto cabe à direita na foto virada
  const fits = flipFits((a) => a.x0 >= 10 && a.x1 <= 40);
  assert.equal(fits({ x0: 65, x1: 85, y0: 0, y1: 10 }), true);
  assert.equal(fits({ x0: 15, x1: 35, y0: 0, y1: 10 }), false);
});

test("carrinho aceita logo nas duas mangas", () => {
  const line = cartLineSchema.safeParse({
    id: "a",
    slug: "camiseta-malha-pv",
    color: "branco",
    sizes: { M: 5 },
    positions: ["manga", "manga-direita"],
    placements: { "manga-direita": { x: 46, y: 28, w: 6 } },
  });
  assert.equal(line.success, true, JSON.stringify(line.error?.issues));
});

test("checkout aceita posição ajustada e recusa valores fora do limite", () => {
  const base = { id: "x", slug: "camiseta-malha-pv", color: "marinho", sizes: { M: 10 }, positions: ["frente"] };
  assert.equal(cartLineSchema.safeParse({ ...base, placements: { frente: { x: 40, y: 30, w: 8.5 } } }).success, true);
  assert.equal(cartLineSchema.safeParse({ ...base, placements: { frente: { x: 40, y: 30, s: 1.2 } } }).success, true);
  assert.equal(cartLineSchema.safeParse({ ...base, placements: { frente: { x: 40, y: 30, s: 9 } } }).success, false);
  assert.equal(cartLineSchema.safeParse({ ...base, placements: { frente: { x: 40, y: 30, w: 500 } } }).success, false);
  assert.equal(cartLineSchema.safeParse({ ...base, placements: { frente: { x: 40, y: 30 } } }).success, false);
});

test("costas: a logo nasce no alto da área (padrão da fábrica) e cresce para baixo", async () => {
  const { resizePlacement } = await import("../lib/mockup.ts");
  const spot = logoSpots(camiseta).costas!;
  assert.ok(spot.top);
  for (const aspect of [1, 4, 0.5]) {
    const box = logoBox(spot, undefined, aspect);
    assert.equal(box.x, (spot.area.x0 + spot.area.x1) / 2);
    // o alto da logo encosta no alto da área
    assert.ok(Math.abs(box.y - box.hPct / 2 - spot.area.y0) < 0.01);
    // aumentar e diminuir não tira o alto da logo do lugar
    for (const w of [box.w + 4, box.w - 4]) {
      const r = logoBox(spot, resizePlacement(undefined, w, spot, aspect), aspect);
      assert.ok(Math.abs(r.y - r.hPct / 2 - spot.area.y0) < 0.01);
      assert.ok(inside(r, spot.bounds));
    }
  }
  // frente e manga continuam centralizadas; o cós da calça também
  assert.ok(!logoSpots(camiseta).frente!.top);
  assert.ok(!logoSpots({ category: "calcas", slug: "calca-brim-elastico-total" }).costas!.top);
});

test("manga: área no meio da manga de cada foto, não no meio da imagem", () => {
  assert.equal(logoSpots(camiseta).manga!.x, 54);
  // foto virada para o outro lado
  assert.ok(logoSpots({ category: "camisas", slug: "camisa-social-feminina-manga-longa" })["manga-direita"]!.x < 50);
  // produto cadastrado no painel (sem medida própria) usa o padrão da categoria
  assert.equal(logoSpots({ category: "camisetas", slug: "produto-novo" }).manga!.x, 55);
});

test("bordas vazias da logo são cortadas: fundo transparente ou branco", async () => {
  const { contentBox } = await import("../lib/logo-trim.ts");
  // imagem 20 × 20 com um desenho de 10 × 2 no meio
  const img = (bg: [number, number, number, number], ink: [number, number, number, number] = [10, 40, 120, 255]) => {
    const px = new Uint8ClampedArray(20 * 20 * 4);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) px.set(x >= 5 && x < 15 && y >= 9 && y < 11 ? ink : bg, (y * 20 + x) * 4);
    return px;
  };
  const near = (b: { x: number; y: number; w: number; h: number } | null) => !!b && b.x >= 3 && b.x <= 5 && b.w >= 10 && b.w <= 13 && b.h >= 2 && b.h <= 5;
  assert.ok(near(contentBox(img([0, 0, 0, 0]), 20, 20)), "fundo transparente");
  assert.ok(near(contentBox(img([255, 255, 255, 255]), 20, 20)), "fundo branco (JPG)");
  // fundo colorido pode ser parte da logo: não corta
  assert.equal(contentBox(img([200, 0, 0, 255]), 20, 20), null);
  // imagem sem sobra: nada a cortar
  assert.equal(contentBox(img([10, 40, 120, 255]), 20, 20), null);
  // logo larga: no bordado das costas (até 27 cm) a largura chega a 27 cm
  const bordado = logoSpots(camiseta, "Bordado").costas!;
  assert.equal(maxLogoCm(bordado, 1), 27);
  assert.equal(maxLogoCm(bordado, 4), 27);
});

// peça de mentira para os testes: um retângulo (x 20–80, y 10–90) é a peça, o resto é fundo
const piece = (a: { x0: number; x1: number; y0: number; y1: number }) => a.x0 >= 20 && a.x1 <= 80 && a.y0 >= 10 && a.y1 <= 90;

test("arrastar: a logo vai para qualquer lugar da peça, mas não sai dela (desliza pela borda)", async () => {
  const { moveWithin } = await import("../lib/mockup.ts");
  const spot = logoSpots(camiseta).frente!;
  const from = { x: 50, y: 40, w: 10 };
  // dentro da peça: vai exatamente para onde foi arrastada (longe da área padrão do peito)
  assert.deepEqual(moveWithin(from, { x: 35, y: 70 }, spot, 1, piece), { x: 35, y: 70, w: 10 });
  // arrastou para o fundo, à direita: para na borda da peça, na mesma altura
  const r = moveWithin(from, { x: 95, y: 40 }, spot, 1, piece);
  const half = 10 / spot.cm / 2;
  assert.ok(r.x + half <= 80 + 1e-6 && r.x + half > 79, `parou na borda (${r.x})`);
  assert.equal(r.y, 40);
  // na diagonal para fora: desliza pela borda, seguindo o movimento que cabe
  const d = moveWithin(from, { x: 95, y: 60 }, spot, 1, piece);
  assert.ok(piece({ x0: d.x - half, x1: d.x + half, y0: d.y - half, y1: d.y + half }));
  assert.ok(Math.abs(d.y - 60) < 0.01, `seguiu até a altura pedida (${d.y})`);
});

test("puxar o canto: o canto oposto fica parado e a logo não passa da peça nem do máximo", async () => {
  const { resizeFromCorner } = await import("../lib/mockup.ts");
  const spot = logoSpots(camiseta).frente!;
  const from = { x: 50, y: 40, w: 10 };
  const h = 10 / spot.cm / 2;
  const nw = { x: 50 - h, y: 40 - h };
  // puxa o canto de baixo à direita: cresce para baixo e para a direita
  const big = resizeFromCorner(from, "se", { x: 50 + h + 5, y: 40 + h + 5 }, spot, 1, piece);
  assert.ok(big.w > 10);
  const bh = big.w / spot.cm / 2;
  assert.ok(Math.abs(big.x - bh - nw.x) < 0.02 && Math.abs(big.y - bh - nw.y) < 0.02, "canto de cima à esquerda parado");
  // puxa muito para fora: para na borda da peça (x até 80)
  const edge = resizeFromCorner(from, "se", { x: 99, y: 99 }, spot, 1, piece);
  const eh = edge.w / spot.cm / 2;
  assert.ok(edge.x + eh <= 80 + 1e-6, "não passa da peça");
  assert.ok(edge.w <= maxLogoCm(spot, 1));
  // diminuir pelo canto de cima à esquerda: o de baixo à direita fica parado
  const small = resizeFromCorner(from, "nw", { x: 50, y: 40 }, spot, 1, piece);
  const sh = small.w / spot.cm / 2;
  assert.ok(small.w < 10 && Math.abs(small.x + sh - (50 + h)) < 0.02);
});

test("botões de tamanho: se não cabe no lugar, a logo anda o mínimo para dentro da peça", async () => {
  const { resizePlacement } = await import("../lib/mockup.ts");
  const spot = logoSpots(camiseta).frente!;
  // logo encostada na borda direita da peça
  const half = 10 / spot.cm / 2;
  const at = { x: 80 - half - 0.1, y: 50, w: 10 };
  const r = resizePlacement(at, 20, spot, 1, piece);
  assert.equal(r.w, 20);
  const rh = 20 / spot.cm / 2;
  assert.ok(piece({ x0: r.x - rh, x1: r.x + rh, y0: r.y - rh, y1: r.y + rh }));
  assert.ok(Math.abs(r.x - at.x) < 8, "andou pouco");
});

test("contorno da peça: a grade diz se a logo cai só em cima da peça", async () => {
  const { buildFitMap, fitsInside } = await import("../lib/fit-map.ts");
  // foto 200 × 200 com a peça num retângulo de 40 a 160 (x) e 20 a 180 (y)
  const m = new Float32Array(200 * 200);
  for (let y = 20; y < 180; y++) for (let x = 40; x < 160; x++) m[y * 200 + x] = 1;
  const f = buildFitMap(m, 200, 200)!;
  assert.ok(f);
  assert.ok(fitsInside(f, { x0: 25, x1: 75, y0: 15, y1: 85 }));
  assert.ok(!fitsInside(f, { x0: 15, x1: 30, y0: 40, y1: 50 }), "metade no fundo");
  assert.ok(!fitsInside(f, { x0: 50, x1: 60, y0: 85, y1: 95 }), "passou da barra");
  // máscara vazia (não deu para medir): sem contorno
  assert.equal(buildFitMap(new Float32Array(100), 10, 10), null);
});

test("logo que ficou fora da peça volta para dentro ao ser arrastada e não cresce lá fora", async () => {
  const { moveWithin, resizeFromCorner } = await import("../lib/mockup.ts");
  const spot = logoSpots(camiseta).frente!;
  const out = { x: 10, y: 95, w: 10 };
  const half = 10 / spot.cm / 2;
  const r = moveWithin(out, { x: 12, y: 96 }, spot, 1, piece);
  assert.ok(piece({ x0: r.x - half, x1: r.x + half, y0: r.y - half, y1: r.y + half }), `voltou para a peça (${r.x}, ${r.y})`);
  assert.equal(resizeFromCorner(out, "se", { x: 40, y: 99 }, spot, 1, piece).w, 10);
});
