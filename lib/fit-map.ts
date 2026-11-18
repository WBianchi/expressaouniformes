// Contorno da peça na foto, para o simulador não deixar a logo sair da peça (nem ir para o fundo).
// A máscara peça × fundo (a mesma da troca de cor) vira uma grade de 1% × 1% da foto; uma
// tabela de somas diz em tempo constante se um retângulo inteiro cai só em cima da peça.
// Sem dependência do navegador, para rodar também nos testes.
import type { Area } from "./mockup.ts";

/** Grade da peça: `n` × `n` células (cada uma = 1/n da foto); `sum` é a tabela de somas (n+1)². */
export type FitMap = { n: number; sum: Uint32Array };

/** Célula conta como peça quando quase toda ela é peça (a logo não encosta na beirada nem na sombra). */
const FULL = 0.85;

/**
 * Monta a grade a partir da máscara (`m`, valores de 0 a 1, `w` × `h`). A foto aparece quadrada
 * (cortada no meio, como o object-fit: cover), então só o quadrado central conta.
 * Devolve null quando a máscara não parece de uma peça (quase vazia ou quase cheia).
 */
export function buildFitMap(m: ArrayLike<number>, w: number, h: number, n = 100): FitMap | null {
  const side = Math.min(w, h);
  const ox = (w - side) / 2;
  const oy = (h - side) / 2;
  const sum = new Uint32Array((n + 1) * (n + 1));
  let inside = 0;
  for (let r = 0; r < n; r++) {
    const y0 = Math.floor(oy + (r / n) * side);
    const y1 = Math.max(y0 + 1, Math.floor(oy + ((r + 1) / n) * side));
    let row = 0;
    for (let c = 0; c < n; c++) {
      const x0 = Math.floor(ox + (c / n) * side);
      const x1 = Math.max(x0 + 1, Math.floor(ox + ((c + 1) / n) * side));
      let on = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (m[y * w + x] > 0.5) on++;
      const cell = on >= FULL * (y1 - y0) * (x1 - x0) ? 1 : 0;
      inside += cell;
      row += cell;
      sum[(r + 1) * (n + 1) + c + 1] = sum[r * (n + 1) + c + 1] + row;
    }
  }
  const share = inside / (n * n);
  return share < 0.05 || share > 0.97 ? null : { n, sum };
}

/** O retângulo (em % da foto) cai inteiro em cima da peça. */
export function fitsInside(f: FitMap, a: Area): boolean {
  const { n, sum } = f;
  const cell = (v: number, up: boolean) => Math.min(n, Math.max(0, up ? Math.ceil((v / 100) * n - 1e-6) : Math.floor((v / 100) * n + 1e-6)));
  const c0 = cell(a.x0, false);
  const c1 = cell(a.x1, true);
  const r0 = cell(a.y0, false);
  const r1 = cell(a.y1, true);
  if (c1 <= c0 || r1 <= r0) return true;
  const at = (r: number, c: number) => sum[r * (n + 1) + c];
  return at(r1, c1) - at(r0, c1) - at(r1, c0) + at(r0, c0) === (c1 - c0) * (r1 - r0);
}
