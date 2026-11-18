// Onde a logo aparece na foto do produto (prévia ilustrativa sobre as fotos reais).
// Cada posição tem uma área padrão com tamanho real (cm), a da ficha da fábrica: é onde a logo
// nasce (nas costas, no alto dela). Daí o cliente leva a logo para qualquer lugar da peça naquela
// vista (o simulador não deixa sair do contorno da peça, medido na foto) e aumenta até o máximo
// da posição. Coordenadas em % da foto quadrada.
import { getProduct, type Position, type Product, type Technique } from "./catalog.ts";

/** "side" é a vista lateral (onde fica a manga) */
export type View = "front" | "back" | "side";
/** Retângulo (em % da foto). */
export type Area = { x0: number; x1: number; y0: number; y1: number };
/**
 * Posição na foto: centro (x, y) e área padrão (onde a logo nasce), até onde ela pode ir
 * (`bounds`) e escala da foto (`cm` = quantos centímetros da peça cabem em 1% da foto).
 */
export type Spot = {
  view: View;
  x: number;
  y: number;
  /** área padrão da posição (ficha da fábrica): a logo nasce nela */
  area: Area;
  /** até onde a logo pode ir nesta vista; no simulador, o contorno da peça limita ainda mais */
  bounds: Area;
  cm: number;
  /** maior logo da posição (cm) */
  max: { w: number; h: number };
  /** tamanho máximo da logo (cm) menor que o da posição, por limite da técnica (ex.: bordado nas costas) */
  cap?: { w: number; h: number };
  /** a logo nasce no alto da área (costas: perto da gola, não no meio das costas) */
  top?: boolean;
};

/** Limites de tamanho por técnica e posição: a fábrica não faz bordado grande nas costas. */
export const TECHNIQUE_CAPS: Partial<Record<Technique, Partial<Record<Position, { w: number; h: number }>>>> = {
  Bordado: { costas: { w: 27, h: 5 } },
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round = (n: number, step: number) => Math.round(n / step) * step;

/** Retângulo de `wcm` × `hcm` centímetros, centrado em (x, y), na foto com escala `cm` por %. */
const rect = (x: number, y: number, wcm: number, hcm: number, cm: number): Area => {
  const w = wcm / cm / 2;
  const h = hcm / cm / 2;
  return { x0: clamp(x - w, 1, 99), x1: clamp(x + w, 1, 99), y0: clamp(y - h, 1, 99), y1: clamp(y + h, 1, 99) };
};
/** A foto inteira (menos uma beirada): frente e costas vão até o contorno da peça. */
const WHOLE: Area = { x0: 1, x1: 99, y0: 1, y1: 99 };

// Escala de cada foto: comprimento real da peça (tamanho M) ÷ altura que ela ocupa na foto
// (medida nas máscaras; as peças ocupam ~90% da altura). Ex.: camiseta de 72 cm em 89% → 0,81 cm por %.
const SCALE: Record<string, number> = {
  camisetas: 0.81,
  polos: 0.79,
  camisas: 0.82,
  operacional: 0.82,
  calcas: 1.09,
  jalecos: 1.09,
  moletons: 0.76,
  alimenticia: 0.9,
  "alta-visibilidade": 0.69,
};
const SCALE_BY_SLUG: Record<string, number> = {
  "bermuda-elastico-total": 0.62,
  "bermuda-meio-cos": 0.62,
  "jaleco-privativo": 0.79,
  "jaleco-guarda-po": 1.14,
  "jaleco-guarda-po-manga-longa": 1.14,
  "avental-frontal": 0.97,
};

/** Área padrão de cada posição (cm), como na ficha de personalização: onde a logo nasce. */
const PEITO = [10, 10] as const;
const COSTAS = [28, 35] as const;
const MANGA = [8, 8] as const;

/**
 * Maior logo de cada posição (cm). Frente e costas: o quadro da estampa grande da ficha (28 × 35);
 * a logo do peito pode virar uma estampa grande no meio da frente. Manga: até 10 × 10.
 */
export const POSITION_MAX: Record<Position, { w: number; h: number }> = {
  frente: { w: 28, h: 35 },
  costas: { w: 28, h: 35 },
  manga: { w: 10, h: 10 },
};
/** Até onde a logo da manga anda a partir do centro da manga (cm): ela não vai para o corpo da peça. */
const SLEEVE_REACH = 8;

type Layout = Partial<Record<Position, { view: View; x: number; y: number; size: readonly [number, number]; top?: boolean }>>;

// manga: centro da manga na foto de lado (a manga fica um pouco atrás do meio da foto)
const SIDE = { view: "side", x: 55, y: 28, size: MANGA } as const;

// Centro de cada área, medido nas fotos de cada categoria (peito do lado esquerdo de quem veste).
const byCategory: Record<string, Layout> = {
  camisetas: { frente: { view: "front", x: 61, y: 31, size: PEITO }, costas: { view: "back", x: 50, y: 38, size: COSTAS, top: true }, manga: SIDE },
  polos: { frente: { view: "front", x: 63, y: 34, size: PEITO }, costas: { view: "back", x: 50, y: 38, size: COSTAS, top: true }, manga: SIDE },
  camisas: { frente: { view: "front", x: 62, y: 32, size: PEITO }, costas: { view: "back", x: 50, y: 36, size: COSTAS, top: true }, manga: SIDE },
  operacional: { frente: { view: "front", x: 64, y: 34, size: PEITO }, costas: { view: "back", x: 50, y: 34, size: COSTAS, top: true }, manga: SIDE },
  jalecos: { frente: { view: "front", x: 62, y: 33, size: PEITO }, costas: { view: "back", x: 50, y: 32, size: COSTAS, top: true }, manga: SIDE },
  // moletom: logo grande no centro do peito
  moletons: { frente: { view: "front", x: 50, y: 40, size: [25, 15] }, costas: { view: "back", x: 50, y: 40, size: COSTAS, top: true }, manga: SIDE },
  // calça: frente perto do bolso; costas no cós
  calcas: { frente: { view: "front", x: 38, y: 27, size: PEITO }, costas: { view: "back", x: 50, y: 17, size: [20, 8] } },
  alimenticia: { frente: { view: "front", x: 63, y: 32, size: PEITO }, costas: { view: "back", x: 50, y: 35, size: COSTAS, top: true }, manga: SIDE },
  "alta-visibilidade": { frente: { view: "front", x: 62, y: 31, size: PEITO }, costas: { view: "back", x: 50, y: 29, size: [30, 20], top: true }, manga: SIDE },
};

// Centro da manga (x, y em %) medido na foto de lado de cada peça: a logo fica no meio da manga.
const SLEEVE: Record<string, readonly [number, number]> = {
  "camiseta-malha-pv": [54, 28],
  "camiseta-malha-pv-manga-longa": [53.5, 28],
  "camiseta-baby-look": [55, 23.5],
  "polo-masculina-piquet": [55, 28],
  "polo-feminina-piquet": [54, 27],
  "camisa-social-masculina": [55, 29],
  "camisa-social-masculina-manga-longa": [55, 29],
  "camisa-social-feminina": [55, 29],
  // foto virada para o outro lado: a manga fica à esquerda do meio
  "camisa-social-feminina-manga-longa": [46.5, 27],
  "jaleco-gola-italiana": [54.5, 28],
  "jaleco-gola-italiana-manga-longa": [54, 29],
  "jaleco-com-botoes": [55, 29],
  "jaleco-com-botoes-manga-longa": [55.5, 28],
  "jaleco-guarda-po": [54, 26],
  "jaleco-guarda-po-manga-longa": [53.5, 27],
  "jaleco-limpeza": [55, 29],
  "jaleco-tradicional": [55.5, 27],
  "jaleco-tradicional-manga-longa": [54.5, 27],
  "jaleco-privativo": [55.5, 27],
  "blusa-moletom": [53, 29],
  "moletom-canguru": [53.5, 31],
};

// Ajuste fino por produto.
const bySlug: Record<string, Layout> = {
  // o peitilho é estreito: a logo fica centralizada nele
  "avental-frontal": { frente: { view: "front", x: 50, y: 33, size: [12, 12] } },
  "avental-bata": { frente: { view: "front", x: 59, y: 34, size: PEITO } },
};

/**
 * Onde cada posição aparece na foto da peça (sem as posições que a peça não tem).
 * Com a técnica, aplica o limite de tamanho dela (ex.: bordado nas costas até 27 × 5 cm).
 */
export function logoSpots(p: Pick<Product, "category"> & { slug?: string }, technique?: Technique | null): Partial<Record<Position, Spot>> {
  const cm = (p.slug && SCALE_BY_SLUG[p.slug]) || SCALE[p.category] || SCALE.camisetas;
  const layout: Layout = { ...(byCategory[p.category] ?? byCategory.camisetas), ...(p.slug ? bySlug[p.slug] : undefined) };
  const sleeve = p.slug ? SLEEVE[p.slug] : undefined;
  if (layout.manga && sleeve) layout.manga = { ...layout.manga, x: sleeve[0], y: sleeve[1] };
  const out: Partial<Record<Position, Spot>> = {};
  for (const [pos, l] of Object.entries(layout) as [Position, NonNullable<Layout[Position]>][]) {
    const cap = technique ? TECHNIQUE_CAPS[technique]?.[pos] : undefined;
    // o máximo nunca fica menor que a área padrão (ex.: costas da alta visibilidade, 30 × 20)
    const max = { w: Math.max(POSITION_MAX[pos].w, l.size[0]), h: Math.max(POSITION_MAX[pos].h, l.size[1]) };
    const bounds = pos === "manga" ? rect(l.x, l.y, SLEEVE_REACH * 2, SLEEVE_REACH * 2, cm) : WHOLE;
    out[pos] = { view: l.view, x: l.x, y: l.y, cm, area: rect(l.x, l.y, l.size[0], l.size[1], cm), bounds, max, ...(cap ? { cap } : {}), ...(l.top ? { top: true } : {}) };
  }
  for (const pos of (p.slug && getProduct(p.slug)?.noPositions) || []) delete out[pos];
  return out;
}

export const availablePositions = (p: Pick<Product, "category"> & { slug?: string }) =>
  (["frente", "costas", "manga"] as Position[]).filter((pos) => !!logoSpots(p)[pos]);

// ---------------------------------------------------------------- posição e tamanho da logo

/**
 * Posição e tamanho escolhidos pelo cliente: centro (x, y) em % da foto e largura da logo
 * em cm (a altura sai da proporção da imagem). `s` é o formato antigo (escala), lido só
 * em carrinhos e pedidos salvos antes da mudança.
 */
export type Placement = { x: number; y: number; w: number };
export type PlacementInput = { x: number; y: number; w?: number; s?: number };
export type Placements = Partial<Record<Position, PlacementInput>>;

/** Menor largura da logo (cm). */
export const MIN_LOGO_CM = 2;
/** Tamanho inicial: esta fração do maior tamanho que cabe na área padrão. */
const START = 0.8;

const widthCm = (a: Area, cm: number) => (a.x1 - a.x0) * cm;
const heightCm = (a: Area, cm: number) => (a.y1 - a.y0) * cm;

/** Tamanho real da área padrão da posição (cm). */
export function areaCm(s: Spot) {
  return { w: widthCm(s.area, s.cm), h: heightCm(s.area, s.cm) };
}

/** Maior largura (cm) de uma logo com proporção `aspect` (largura ÷ altura) num retângulo de w × h cm. */
const fitWidth = (w: number, h: number, aspect: number) => Math.floor(Math.min(w, h * aspect) * 10 + 1e-6) / 10;

/**
 * Maior largura (cm) da logo nesta posição, com a proporção `aspect` (largura ÷ altura):
 * o máximo da posição, o limite da técnica e o espaço da vista.
 * (+ 1e-6: a conta em % devolve 9,99999 numa área de 10 cm)
 */
export function maxLogoCm(s: Spot, aspect = 1) {
  const w = Math.min(widthCm(s.bounds, s.cm), s.max.w, s.cap?.w ?? Infinity);
  const h = Math.min(heightCm(s.bounds, s.cm), s.max.h, s.cap?.h ?? Infinity);
  return fitWidth(w, h, aspect);
}
export const minLogoCm = (s: Spot, aspect = 1) => Math.min(MIN_LOGO_CM, maxLogoCm(s, aspect));

/** Posição inicial: centralizada na área padrão (nas costas, encostada no alto dela), num tamanho que cabe nela com folga. */
export function defaultPlacement(s: Spot, aspect = 1): Placement {
  const a = areaCm(s);
  const max = Math.min(maxLogoCm(s, aspect), fitWidth(Math.min(a.w, s.cap?.w ?? Infinity), Math.min(a.h, s.cap?.h ?? Infinity), aspect));
  const w = Math.max(minLogoCm(s, aspect), Math.floor(max * START * 2) / 2);
  const y = s.top ? s.area.y0 + w / aspect / s.cm / 2 : (s.area.y0 + s.area.y1) / 2;
  return { x: (s.area.x0 + s.area.x1) / 2, y, w };
}

/**
 * Mantém a logo inteira dentro da vista (`bounds`) e no tamanho permitido. Formato antigo (`s`)
 * vira largura proporcional ao tamanho inicial.
 */
export function clampPlacement(p: PlacementInput, s: Spot, aspect = 1): Placement {
  const start = defaultPlacement(s, aspect);
  const raw = p.w ?? (p.s !== undefined ? start.w * p.s : start.w);
  const w = Math.round(clamp(raw, minLogoCm(s, aspect), maxLogoCm(s, aspect)) * 10) / 10;
  const hw = w / s.cm / 2;
  const hh = w / aspect / s.cm / 2;
  const { x0, x1, y0, y1 } = s.bounds;
  return { x: clamp(round(p.x, 0.01), x0 + hw, x1 - hw), y: clamp(round(p.y, 0.01), y0 + hh, y1 - hh), w };
}

/** Retângulo da logo na foto (centro e tamanho em %), já dentro da vista. */
export function logoBox(s: Spot, p: PlacementInput | undefined, aspect = 1) {
  const c = clampPlacement(p ?? defaultPlacement(s, aspect), s, aspect);
  return { ...c, wPct: c.w / s.cm, hPct: c.w / aspect / s.cm, hCm: Math.round((c.w / aspect) * 10) / 10 };
}

// ---------------------------------------------------------------- contorno da peça (simulador)

/**
 * Diz se um retângulo (em % da foto) cabe inteiro na peça: vem do contorno medido na foto
 * (lib/fit-map.ts). Sem contorno (foto ainda carregando), tudo cabe e vale só a vista.
 */
export type Fits = (a: Area) => boolean;

const rectOf = (x: number, y: number, w: number, s: Spot, aspect: number): Area => {
  const hw = w / s.cm / 2;
  const hh = w / aspect / s.cm / 2;
  return { x0: x - hw, x1: x + hw, y0: y - hh, y1: y + hh };
};
const within = (a: Area, b: Area) => a.x0 >= b.x0 - 1e-9 && a.x1 <= b.x1 + 1e-9 && a.y0 >= b.y0 - 1e-9 && a.y1 <= b.y1 + 1e-9;
/** A logo nesta posição cabe na vista e na peça. */
const placeable = (p: Placement, s: Spot, aspect: number, fits?: Fits) => {
  const r = rectOf(p.x, p.y, p.w, s, aspect);
  return within(r, s.bounds) && (!fits || fits(r));
};

/** O lugar mais perto de `p` onde a logo (do mesmo tamanho) cabe na peça, procurando em anéis de 0,5%; null se não cabe em lugar nenhum perto. */
function nearestFit(p: Placement, s: Spot, aspect: number, fits: Fits, reach = 30): Placement | null {
  for (let r = 0.5; r <= reach; r += 0.5)
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      const q = clampPlacement({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, w: p.w }, s, aspect);
      if (placeable(q, s, aspect, fits)) return q;
    }
  return null;
}

/**
 * Arrastar: leva a logo para `to` sem sair da peça. Se o ponto não cabe, ela vai até a borda
 * da peça no caminho e desliza por ela (anda só na horizontal ou só na vertical) o que der.
 */
export function moveWithin(from: Placement, to: { x: number; y: number }, s: Spot, aspect = 1, fits?: Fits): Placement {
  const target = clampPlacement({ ...to, w: from.w }, s, aspect);
  const ok = (x: number, y: number) => placeable({ x, y, w: from.w }, s, aspect, fits);
  if (ok(target.x, target.y) || !fits) return target;
  // a logo estava fora da peça (foto de outra cor, logo antiga): vai para o lugar da peça mais perto do ponteiro
  if (!ok(from.x, from.y)) return nearestFit(target, s, aspect, fits) ?? target;
  // o ponto mais longe que cabe no caminho de a até b (a cabe)
  const reach = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 16; i++) {
      const t = (lo + hi) / 2;
      if (ok(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) lo = t;
      else hi = t;
    }
    return { x: a.x + (b.x - a.x) * lo, y: a.y + (b.y - a.y) * lo };
  };
  const edge = reach(from, target);
  // desliza: primeiro na horizontal e depois na vertical, ou o contrário; fica o que chegar mais perto
  const h = reach(edge, { x: target.x, y: edge.y });
  const hv = reach(h, { x: h.x, y: target.y });
  const v = reach(edge, { x: edge.x, y: target.y });
  const vh = reach(v, { x: target.x, y: v.y });
  const d = (p: { x: number; y: number }) => Math.hypot(p.x - target.x, p.y - target.y);
  const best = d(hv) <= d(vh) ? hv : vh;
  return { x: best.x, y: best.y, w: from.w };
}

/** Canto da logo (n = em cima, s = embaixo, w = esquerda, e = direita). */
export type Corner = "nw" | "ne" | "sw" | "se";

/**
 * Puxar um canto: o canto oposto fica parado e a logo cresce ou diminui (na proporção dela)
 * até onde o ponteiro está, sem passar do máximo e sem sair da peça.
 */
export function resizeFromCorner(from: Placement, corner: Corner, to: { x: number; y: number }, s: Spot, aspect = 1, fits?: Fits): Placement {
  const sx = corner.includes("e") ? 1 : -1;
  const sy = corner.includes("s") ? 1 : -1;
  const cur = rectOf(from.x, from.y, from.w, s, aspect);
  // canto que fica parado
  const ax = sx > 0 ? cur.x0 : cur.x1;
  const ay = sy > 0 ? cur.y0 : cur.y1;
  const at = (w: number): Placement => ({ x: ax + (sx * w) / s.cm / 2, y: ay + (sy * w) / aspect / s.cm / 2, w });
  // a largura segue o lado que o ponteiro mais puxou (em décimos de cm)
  const want = Math.max((to.x - ax) * sx, (to.y - ay) * sy * aspect) * s.cm;
  const w = Math.round(clamp(want, minLogoCm(s, aspect), maxLogoCm(s, aspect)) * 10) / 10;
  const ok = (p: Placement) => placeable(p, s, aspect, fits);
  // diminuir (com o canto oposto parado) nunca sai da peça
  if (w <= from.w || ok(at(w))) return at(w);
  // fora da peça, a logo não cresce (arrastar leva ela de volta para dentro)
  if (!ok(at(from.w))) return at(from.w);
  // a maior largura entre a atual e a pedida que ainda cabe
  let lo = from.w;
  let hi = w;
  for (let i = 0; i < 14; i++) {
    const m = (lo + hi) / 2;
    if (ok(at(m))) lo = m;
    else hi = m;
  }
  const best = Math.floor(lo * 10) / 10;
  return at(Math.max(best, Math.min(from.w, w)));
}

/**
 * Troca o tamanho da logo (botões e régua) sem tirar ela do lugar: cresce a partir do centro e,
 * nas costas, mantém o alto da logo onde está (ela cresce para baixo). Se não couber ali, ela
 * anda o mínimo para dentro da peça; se não couber em lugar nenhum perto, fica no maior tamanho que cabe.
 */
export function resizePlacement(p: PlacementInput | undefined, w: number, s: Spot, aspect = 1, fits?: Fits): Placement {
  const box = logoBox(s, p, aspect);
  const next = Math.round(clamp(w, minLogoCm(s, aspect), maxLogoCm(s, aspect)) * 10) / 10;
  const y = s.top ? box.y - box.hPct / 2 + next / aspect / s.cm / 2 : box.y;
  const want = clampPlacement({ x: box.x, y, w: next }, s, aspect);
  const ok = (q: Placement) => placeable(q, s, aspect, fits);
  if (!fits || ok(want)) return want;
  // não cabe ali: o lugar da peça mais perto
  const near = nearestFit(want, s, aspect, fits, 25);
  if (near) return near;
  if (!ok({ x: box.x, y: box.y, w: box.w })) return want;
  // não coube em lugar nenhum perto: o maior tamanho que cabe no lugar atual
  let lo = box.w;
  let hi = next;
  for (let i = 0; i < 14; i++) {
    const m = (lo + hi) / 2;
    if (ok(clampPlacement({ x: box.x, y: s.top ? box.y - box.hPct / 2 + m / aspect / s.cm / 2 : box.y, w: m }, s, aspect))) lo = m;
    else hi = m;
  }
  const best = Math.floor(lo * 10) / 10;
  return clampPlacement({ x: box.x, y: s.top ? box.y - box.hPct / 2 + best / aspect / s.cm / 2 : box.y, w: best }, s, aspect);
}

export const isPlacement = (v: unknown): v is PlacementInput => {
  const p = v as PlacementInput;
  return (
    !!p &&
    [p.x, p.y].every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100) &&
    (p.w === undefined || (typeof p.w === "number" && p.w >= 0.5 && p.w <= 100)) &&
    (p.s === undefined || (typeof p.s === "number" && p.s >= 0.5 && p.s <= 2)) &&
    (p.w !== undefined || p.s !== undefined)
  );
};

/** "8,5" (cm, uma casa) */
export const cmText = (n: number) => (Math.round(n * 10) / 10).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
