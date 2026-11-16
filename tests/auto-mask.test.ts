import { test } from "node:test";
import assert from "node:assert/strict";
import { autoMask } from "../lib/auto-mask.ts";
import { rgbToLab } from "../lib/lab.ts";
import { withPhotos } from "../lib/product-media.ts";
import { getProduct } from "../lib/catalog.ts";

const W = 160, H = 160;

/** "Camiseta" sintética: tronco + mangas sobre fundo liso, com sombreado e ruído determinístico. */
function photo(bg: number, piece: number, seed = 1) {
  const inside = (x: number, y: number) => (x >= 50 && x < 110 && y >= 40 && y < 140) || (y >= 40 && y < 70 && x >= 25 && x < 135);
  const L = new Float32Array(W * H), A = new Float32Array(W * H), B = new Float32Array(W * H);
  let r = seed;
  const noise = () => ((r = (r * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff - 0.5) * 3;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      // tecido com dobras (variação suave) e contorno escurecido, como numa foto de catálogo
      const edge = inside(x, y) && (!inside(x - 2, y) || !inside(x + 2, y) || !inside(x, y - 2) || !inside(x, y + 2));
      const v = inside(x, y) ? piece + 6 * Math.sin(x / 9) * Math.sin(y / 13) - (edge ? 18 : 0) : bg - y / 40;
      const c = Math.max(0, Math.min(255, Math.round(v + noise())));
      [L[i], A[i], B[i]] = rgbToLab(c, c, c);
    }
  return { L, A, B, inside };
}

function iou(m: Float32Array, inside: (x: number, y: number) => boolean) {
  let inter = 0, union = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const a = m[y * W + x] > 0.5, b = inside(x, y);
      if (a && b) inter++;
      if (a || b) union++;
    }
  return inter / union;
}

test("máscara automática separa peça escura do fundo claro", () => {
  const p = photo(235, 45);
  assert.ok(iou(autoMask(p.L, p.A, p.B, W, H), p.inside) > 0.9);
});

test("máscara automática separa peça branca do fundo cinza claro pelo contorno", () => {
  const p = photo(225, 240, 7);
  assert.ok(iou(autoMask(p.L, p.A, p.B, W, H), p.inside) > 0.85);
});

test("fotos do painel substituem as do catálogo só onde foram trocadas", () => {
  const p = getProduct("camiseta-malha-pv")!;
  assert.equal(withPhotos(p, undefined), p);
  assert.equal(withPhotos(p, [null, null, null, null, null]), p);
  const m = withPhotos(p, [null, "https://x/v2.webp", "https://x/frente.webp", null, "https://x/lado.webp"]);
  assert.deepEqual(m.photos, [p.photos[0], "https://x/v2.webp"]);
  assert.equal(m.image, "https://x/frente.webp");
  assert.equal(m.back, p.back);
  assert.equal(m.side, "https://x/lado.webp");
  assert.deepEqual(m.gallery, [p.photos[0], "https://x/v2.webp", "https://x/frente.webp", p.back, "https://x/lado.webp"]);
});
