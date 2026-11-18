// Corte das bordas vazias da logo enviada pelo cliente. Muita logo chega num quadrado com
// fundo transparente (ou branco) sobrando em volta do desenho: sem cortar, o simulador mede
// o quadrado inteiro, e a logo de verdade fica pequena e não chega aos cantos da área.

export type Box = { x: number; y: number; w: number; h: number };

/** Diferença de cor aceita como "fundo" (ruído de JPG, sombra leve). */
const TOLERANCE = 40;
/** Pixel com transparência acima disso conta como vazio. */
const ALPHA_MIN = 24;

/**
 * Retângulo do desenho dentro da imagem (pixels RGBA, linha por linha). Fundo é o que é
 * transparente ou, numa imagem sem transparência, o branco dos 4 cantos (quando eles combinam).
 * Devolve null quando não há o que cortar.
 */
export function contentBox(px: ArrayLike<number>, w: number, h: number): Box | null {
  if (w < 3 || h < 3) return null;
  const at = (x: number, y: number) => (y * w + x) * 4;
  const corners = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
  const clear = corners.some((i) => px[i + 3] < 200);
  let bg: [number, number, number] | null = null;
  if (!clear) {
    const [r, g, b] = [0, 1, 2].map((c) => corners.reduce((sum, i) => sum + px[i + c], 0) / 4);
    // cantos de cores diferentes: a imagem não tem um fundo liso para cortar
    if (corners.some((i) => Math.max(Math.abs(px[i] - r), Math.abs(px[i + 1] - g), Math.abs(px[i + 2] - b)) > TOLERANCE)) return null;
    // só fundo branco (ou quase): um quadrado colorido em volta pode fazer parte da logo
    if (Math.min(r, g, b) < 225) return null;
    bg = [r, g, b];
  }
  const ink = (i: number) =>
    px[i + 3] > ALPHA_MIN && (!bg || Math.max(Math.abs(px[i] - bg[0]), Math.abs(px[i + 1] - bg[1]), Math.abs(px[i + 2] - bg[2])) > TOLERANCE);

  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (ink(at(x, y))) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return null; // imagem vazia: deixa como está
  // uma folguinha para não comer a borda suave do desenho
  const pad = Math.max(1, Math.round(Math.max(x1 - x0, y1 - y0) * 0.02));
  const box = { x: Math.max(0, x0 - pad), y: Math.max(0, y0 - pad), w: 0, h: 0 };
  box.w = Math.min(w, x1 + pad + 1) - box.x;
  box.h = Math.min(h, y1 + pad + 1) - box.y;
  // sobra menor que 2% de cada lado: não vale cortar
  if (box.w >= w * 0.96 && box.h >= h * 0.96) return null;
  return box;
}
