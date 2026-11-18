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

test("tamanho em cm mantém a proporção da logo e respeita o máximo da área", () => {
  const spot = logoSpots(camiseta).frente!;
  // logo 2:1 numa área de 10 × 10 cm: até 10 cm de largura (5 de altura)
  const box = logoBox(spot, { x: 50, y: 50, w: 8 }, 2);
  assert.equal(box.w, 8);
  assert.equal(box.hCm, 4);
  assert.ok(Math.abs(box.wPct / box.hPct - 2) < 1e-9);
  assert.equal(clampPlacement({ x: 0, y: 0, w: 40 }, spot, 2).w, maxLogoCm(spot, 2));
  // logo alta (1:2): a altura limita, até 5 cm de largura
  assert.equal(maxLogoCm(spot, 0.5), 5);
});

test("arrastar não deixa a logo inteira sair da área (peito, costas e manga), nem depois de aumentar", () => {
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
        assert.ok(inside(logoBox(spot, p, aspect), spot.area), `${pos} ${x},${y} ${aspect}`);
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
      assert.ok(inside(r, spot.area));
    }
  }
  // frente e manga continuam centralizadas; o cós da calça também
  assert.ok(!logoSpots(camiseta).frente!.top);
  assert.ok(!logoSpots({ category: "calcas", slug: "calca-brim-elastico-total" }).costas!.top);
});

test("manga: área no meio da manga de cada foto, não no meio da imagem", () => {
  assert.equal(logoSpots(camiseta).manga!.x, 54);
  // foto virada para o outro lado
  assert.ok(logoSpots({ category: "camisas", slug: "camisa-social-feminina-manga-longa" }).manga!.x < 50);
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
  // logo larga cortada: no bordado das costas (até 27 × 5 cm) ela chega bem mais larga que 5 cm
  const bordado = logoSpots(camiseta, "Bordado").costas!;
  assert.equal(maxLogoCm(bordado, 1), 5);
  assert.equal(maxLogoCm(bordado, 4), 20);
});
