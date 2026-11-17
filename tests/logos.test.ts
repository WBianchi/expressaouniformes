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
