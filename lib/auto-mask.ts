// Máscara peça × fundo calculada na hora, para as fotos da peça enviadas pelo painel
// (as fotos do catálogo têm máscara pronta, gerada por scripts/generate-masks.py).
// Funciona com fundo liso, branco ou cinza: o fundo é a região ligada à borda da foto,
// com a cor do fundo e sem contorno forte; o resto é a peça.
// Sem dependência do navegador, para rodar também nos testes.

export type AutoMaskOptions = {
  /** distância de cor (ΔE) até a cor do fundo que ainda conta como fundo (sombra suave, degradê) */
  bg: number;
  /** força de contorno (variação de cor por pixel) que separa a peça do fundo */
  edge: number;
  /** quantos pixels o contorno é engrossado para fechar frestas */
  close: number;
  /** pedaços soltos menores que esta fração da maior parte da peça são descartados */
  speck: number;
  /** quantas vezes o granulado do fundo o contorno precisa superar (fotos com ruído) */
  noise: number;
  /** passadas de suavização antes de medir o contorno */
  smooth: number;
  /** menor fração da foto que a peça ocupa; abaixo disso o fundo "vazou" para dentro da peça */
  minArea: number;
  /** crescimento da área (fração) que indica que o fundo tinha vazado para dentro da peça */
  leak: number;
  /** variação de claridade abaixo da qual a área ganha é fundo liso preso, não peça */
  trapped: number;
};

export const AUTO_MASK_DEFAULTS: AutoMaskOptions = { bg: 28, edge: 0.5, close: 2, speck: 0.02, noise: 2, smooth: 1, minArea: 0.1, leak: 0.02, trapped: 0.6 };

const median = (v: number[]) => v.sort((a, b) => a - b)[v.length >> 1] ?? 0;

/**
 * L, A, B: cor de cada pixel em CIELAB (w × h). Devolve a máscara (0 = fundo, 1 = peça),
 * com a borda suavizada.
 */
export function autoMask(L: Float32Array, A: Float32Array, B: Float32Array, w: number, h: number, opts: Partial<AutoMaskOptions> = {}): Float32Array {
  const o = { ...AUTO_MASK_DEFAULTS, ...opts };
  const n = w * h;

  // cor do fundo: mediana da moldura da foto
  const bl: number[] = [], ba: number[] = [], bb: number[] = [];
  const frame = 3;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (x >= frame && x < w - frame && y >= frame && y < h - frame) continue;
      const i = y * w + x;
      bl.push(L[i]);
      ba.push(A[i]);
      bb.push(B[i]);
    }
  const Lb = median(bl), ab = median(ba), bbg = median(bb);

  // distância de cada pixel até a cor do fundo
  const dist = new Float32Array(n);
  for (let i = 0; i < n; i++) dist[i] = Math.hypot(L[i] - Lb, A[i] - ab, B[i] - bbg);

  // contorno: variação de cor (Sobel) em L, a e b, sobre a foto suavizada (tira o granulado)
  let Ls: Float32Array = L, As: Float32Array = A, Bs: Float32Array = B;
  for (let k = 0; k < o.smooth; k++) [Ls, As, Bs] = [blur3(Ls, w, h), blur3(As, w, h), blur3(Bs, w, h)];
  const sobel = (C: Float32Array, i: number) => {
    const gx = C[i - w + 1] + 2 * C[i + 1] + C[i + w + 1] - C[i - w - 1] - 2 * C[i - 1] - C[i + w - 1];
    const gy = C[i + w - 1] + 2 * C[i + w] + C[i + w + 1] - C[i - w - 1] - 2 * C[i - w] - C[i - w + 1];
    return Math.abs(gx) + Math.abs(gy);
  };
  const grad = new Float32Array(n);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      grad[i] = (sobel(Ls, i) + 0.5 * (sobel(As, i) + sobel(Bs, i))) / 8;
    }
  // foto com ruído (celular, JPEG): o limite sobe conforme o granulado medido no fundo, perto da borda
  const band: number[] = [];
  for (let y = 4; y < h - 4; y += 2)
    for (let x = 4; x < w - 4; x += 2) {
      const d = Math.min(x, y, w - 1 - x, h - 1 - y);
      if (d < 24) band.push(grad[y * w + x]);
    }
  band.sort((a, b) => a - b);
  const noise = band[Math.floor(band.length * 0.9)] ?? 0;
  const limit = Math.max(o.edge, noise * o.noise);
  const edge = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (grad[i] > limit) edge[i] = 1;
  // fundo: cresce a partir da borda da foto pelos pixels parecidos com o fundo e fora do contorno.
  // Se "vazar" para dentro da peça (peça clara em fundo claro, contorno com fresta), a peça
  // encontrada fica pequena demais: tenta de novo com o contorno mais grosso.
  // Sem vazamento, engrossar mais o contorno quase não muda a área; com vazamento, a área cresce.
  let bgm = floodBackground(edge, dist, w, h, o.bg, o.close);
  for (let extra = 2; extra <= 8; extra += 2) {
    const retry = floodBackground(edge, dist, w, h, o.bg, o.close + extra);
    const before = pieceShare(bgm), after = pieceShare(retry);
    if (after < before * (1 + o.leak) && before >= o.minArea) break;
    // o que entrou é liso como o fundo (fundo preso entre partes da peça, não vazamento): fica com o anterior
    if (before >= o.minArea && gainedSpread(bgm, retry, Ls) < Math.max(o.trapped, noise * 1.2)) break;
    bgm = retry;
  }

  // peça = o que não é fundo, sem pedaços soltos (sombra, sujeira)
  const piece = new Uint8Array(n);
  for (let i = 0; i < n; i++) piece[i] = bgm[i] ? 0 : 1;
  dropSpecks(piece, w, h, o.speck);

  // borda suave (2 passadas de média 3×3)
  let m: Float32Array = new Float32Array(n);
  for (let i = 0; i < n; i++) m[i] = piece[i];
  for (let k = 0; k < 2; k++) m = blur3(m, w, h);
  return m;
}

/** Variação de claridade (desvio padrão) do que deixou de ser fundo entre duas tentativas:
 * fundo é liso; tecido tem sombra e dobra. */
function gainedSpread(prev: Uint8Array, next: Uint8Array, L: Float32Array) {
  let sum = 0, sq = 0, cnt = 0;
  for (let i = 0; i < prev.length; i++)
    if (prev[i] && !next[i]) {
      sum += L[i];
      sq += L[i] * L[i];
      cnt++;
    }
  if (!cnt) return 0;
  const mean = sum / cnt;
  return Math.sqrt(Math.max(0, sq / cnt - mean * mean));
}

/** Fração da foto que não é fundo. */
function pieceShare(bgm: Uint8Array) {
  let bg = 0;
  for (let i = 0; i < bgm.length; i++) bg += bgm[i];
  return 1 - bg / bgm.length;
}

/** Fundo = região ligada à borda da foto, com a cor do fundo, sem atravessar o contorno (engrossado `close` px). */
function floodBackground(edge: Uint8Array, dist: Float32Array, w: number, h: number, maxDist: number, close: number) {
  const n = w * h;
  let wall = edge;
  for (let k = 0; k < close; k++) wall = dilate(wall, w, h);
  const bgm = new Uint8Array(n);
  const queue = new Int32Array(n);
  let head = 0, tail = 0;
  const seed = (i: number) => {
    if (!bgm[i] && !wall[i] && dist[i] < maxDist) {
      bgm[i] = 1;
      queue[tail++] = i;
    }
  };
  for (let x = 0; x < w; x++) {
    seed(x);
    seed((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    seed(y * w);
    seed(y * w + w - 1);
  }
  while (head < tail) {
    const i = queue[head++];
    const x = i % w;
    if (x > 0) seed(i - 1);
    if (x < w - 1) seed(i + 1);
    if (i >= w) seed(i - w);
    if (i < n - w) seed(i + w);
  }
  // o contorno engrossado ficou fora do fundo: devolve ao fundo o que encosta nele e tem a cor do fundo
  for (let k = 0; k < close + 1; k++) {
    const grow = dilate(bgm, w, h);
    for (let i = 0; i < n; i++) if (grow[i] && !bgm[i] && dist[i] < maxDist / 3) bgm[i] = 1;
  }
  return bgm;
}

function dilate(src: Uint8Array, w: number, h: number) {
  const out = new Uint8Array(src);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (src[i]) continue;
      if ((x > 0 && src[i - 1]) || (x < w - 1 && src[i + 1]) || (y > 0 && src[i - w]) || (y < h - 1 && src[i + w])) out[i] = 1;
    }
  return out;
}

function blur3(src: Float32Array, w: number, h: number): Float32Array {
  const out = new Float32Array(src.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let sum = 0, cnt = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          sum += src[yy * w + xx];
          cnt++;
        }
      }
      out[y * w + x] = sum / cnt;
    }
  return out;
}

/** Apaga as partes da peça menores que `frac` da maior (sombras e pontos soltos no fundo). */
function dropSpecks(piece: Uint8Array, w: number, h: number, frac: number) {
  const n = w * h;
  const label = new Int32Array(n);
  const sizes = [0];
  const queue = new Int32Array(n);
  for (let s = 0; s < n; s++) {
    if (!piece[s] || label[s]) continue;
    const id = sizes.length;
    let head = 0, tail = 0, size = 0;
    label[s] = id;
    queue[tail++] = s;
    while (head < tail) {
      const i = queue[head++];
      size++;
      const x = i % w;
      const next = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i >= w ? i - w : -1, i < n - w ? i + w : -1];
      for (const j of next)
        if (j >= 0 && piece[j] && !label[j]) {
          label[j] = id;
          queue[tail++] = j;
        }
    }
    sizes.push(size);
  }
  let biggest = 0;
  for (const s of sizes) if (s > biggest) biggest = s;
  for (let i = 0; i < n; i++) if (piece[i] && sizes[label[i]] < biggest * frac) piece[i] = 0;
}
