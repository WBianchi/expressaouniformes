// Onde a logo aparece na foto do produto (prévia ilustrativa sobre as fotos reais).
// Cada posição tem uma área de aplicação com tamanho real (cm): a logo nasce centralizada
// nela, não sai dela ao arrastar e não cresce além dela. Coordenadas em % da foto quadrada.
import { getProduct, type Position, type Product, type Technique } from "./catalog.ts";

/** "side" é a vista lateral (onde fica a manga) */
export type View = "front" | "back" | "side";
/** Retângulo (em % da foto) onde a logo pode ficar. */
export type Area = { x0: number; x1: number; y0: number; y1: number };
/**
 * Área de aplicação de uma posição na foto: centro (x, y), retângulo permitido e escala
 * da foto (`cm` = quantos centímetros da peça cabem em 1% da foto).
 */
export type Spot = {
  view: View;
  x: number;
  y: number;
  area: Area;
  cm: number;
  /** tamanho máximo da logo (cm) menor que a área, por limite da técnica (ex.: bordado nas costas) */
  cap?: { w: number; h: number };
};

/** Limites de tamanho por técnica e posição: a fábrica não faz bordado grande nas costas. */
export const TECHNIQUE_CAPS: Partial<Record<Technique, Partial<Record<Position, { w: number; h: number }>>>> = {
  Bordado: { costas: { w: 27, h: 5 } },
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round = (n: number, step: number) => Math.round(n / step) * step;

/** Área de `wcm` × `hcm` centímetros, centrada em (x, y), na foto com escala `cm` por %. */
const spot = (view: View, x: number, y: number, wcm: number, hcm: number, cm: number): Spot => {
  const w = wcm / cm / 2;
  const h = hcm / cm / 2;
  return { view, x, y, cm, area: { x0: clamp(x - w, 1, 99), x1: clamp(x + w, 1, 99), y0: clamp(y - h, 1, 99), y1: clamp(y + h, 1, 99) } };
};

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

/** Tamanho máximo de cada posição (cm), como na ficha de personalização. */
const PEITO = [10, 10] as const;
const COSTAS = [28, 35] as const;
const MANGA = [8, 8] as const;

type Layout = Partial<Record<Position, { view: View; x: number; y: number; size: readonly [number, number] }>>;

// Centro de cada área, medido nas fotos de cada categoria (peito do lado esquerdo de quem veste).
const byCategory: Record<string, Layout> = {
  camisetas: { frente: { view: "front", x: 61, y: 31, size: PEITO }, costas: { view: "back", x: 50, y: 38, size: COSTAS }, manga: { view: "side", x: 50, y: 28, size: MANGA } },
  polos: { frente: { view: "front", x: 63, y: 34, size: PEITO }, costas: { view: "back", x: 50, y: 38, size: COSTAS }, manga: { view: "side", x: 50, y: 28, size: MANGA } },
  camisas: { frente: { view: "front", x: 62, y: 32, size: PEITO }, costas: { view: "back", x: 50, y: 36, size: COSTAS }, manga: { view: "side", x: 50, y: 28, size: MANGA } },
  operacional: { frente: { view: "front", x: 64, y: 34, size: PEITO }, costas: { view: "back", x: 50, y: 34, size: COSTAS }, manga: { view: "side", x: 50, y: 28, size: MANGA } },
  jalecos: { frente: { view: "front", x: 62, y: 33, size: PEITO }, costas: { view: "back", x: 50, y: 32, size: COSTAS }, manga: { view: "side", x: 50, y: 28, size: MANGA } },
  // moletom: logo grande no centro do peito
  moletons: { frente: { view: "front", x: 50, y: 40, size: [25, 15] }, costas: { view: "back", x: 50, y: 40, size: COSTAS }, manga: { view: "side", x: 50, y: 28, size: MANGA } },
  // calça: frente perto do bolso; costas no cós
  calcas: { frente: { view: "front", x: 38, y: 27, size: PEITO }, costas: { view: "back", x: 50, y: 17, size: [20, 8] } },
  alimenticia: { frente: { view: "front", x: 63, y: 32, size: PEITO }, costas: { view: "back", x: 50, y: 35, size: COSTAS }, manga: { view: "side", x: 50, y: 28, size: MANGA } },
  "alta-visibilidade": { frente: { view: "front", x: 62, y: 31, size: PEITO }, costas: { view: "back", x: 50, y: 29, size: [30, 20] }, manga: { view: "side", x: 50, y: 28, size: MANGA } },
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
  const layout = { ...(byCategory[p.category] ?? byCategory.camisetas), ...(p.slug ? bySlug[p.slug] : undefined) };
  const out: Partial<Record<Position, Spot>> = {};
  for (const [pos, l] of Object.entries(layout) as [Position, NonNullable<Layout[Position]>][]) {
    const cap = technique ? TECHNIQUE_CAPS[technique]?.[pos] : undefined;
    out[pos] = { ...spot(l.view, l.x, l.y, l.size[0], l.size[1], cm), ...(cap ? { cap } : {}) };
  }
  for (const pos of (p.slug && getProduct(p.slug)?.noPositions) || []) delete out[pos];
  return out;
}

export const availablePositions = (p: Pick<Product, "category"> & { slug?: string }) =>
  (["frente", "costas", "manga"] as Position[]).filter((pos) => !!logoSpots(p)[pos]);

/** Vista que mostra melhor as posições escolhidas: frente, a menos que nenhuma esteja nela. */
export function bestView(p: Pick<Product, "category"> & { slug?: string }, positions: Position[]): View {
  const spots = logoSpots(p);
  const views = positions.map((pos) => spots[pos]?.view).filter((v): v is View => !!v);
  return !views.length || views.includes("front") ? "front" : views[0];
}

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
/** Tamanho inicial: esta fração do maior tamanho que cabe na área. */
const START = 0.8;

/** Tamanho real da área (cm). */
export function areaCm(s: Spot) {
  return { w: (s.area.x1 - s.area.x0) * s.cm, h: (s.area.y1 - s.area.y0) * s.cm };
}

/** Maior largura (cm) em que a logo, com a proporção `aspect` (largura ÷ altura), cabe inteira na área. */
export function maxLogoCm(s: Spot, aspect = 1) {
  const a = areaCm(s);
  const w = Math.min(a.w, s.cap?.w ?? Infinity);
  const h = Math.min(a.h, s.cap?.h ?? Infinity);
  // + 1e-6: a conta em % devolve 9,99999 numa área de 10 cm
  return Math.floor(Math.min(w, h * aspect) * 10 + 1e-6) / 10;
}
export const minLogoCm = (s: Spot, aspect = 1) => Math.min(MIN_LOGO_CM, maxLogoCm(s, aspect));

/** Posição inicial: centralizada na área, num tamanho que cabe com folga. */
export function defaultPlacement(s: Spot, aspect = 1): Placement {
  const max = maxLogoCm(s, aspect);
  return { x: (s.area.x0 + s.area.x1) / 2, y: (s.area.y0 + s.area.y1) / 2, w: Math.max(minLogoCm(s, aspect), Math.floor(max * START * 2) / 2) };
}

/**
 * Mantém a logo inteira dentro da área: limita a largura (com a proporção da imagem)
 * e o centro. Formato antigo (`s`) vira largura proporcional ao tamanho inicial.
 */
export function clampPlacement(p: PlacementInput, s: Spot, aspect = 1): Placement {
  const start = defaultPlacement(s, aspect);
  const raw = p.w ?? (p.s !== undefined ? start.w * p.s : start.w);
  const w = Math.round(clamp(raw, minLogoCm(s, aspect), maxLogoCm(s, aspect)) * 10) / 10;
  const hw = w / s.cm / 2;
  const hh = w / aspect / s.cm / 2;
  const { x0, x1, y0, y1 } = s.area;
  return { x: clamp(round(p.x, 0.01), x0 + hw, x1 - hw), y: clamp(round(p.y, 0.01), y0 + hh, y1 - hh), w };
}

/** Retângulo da logo na foto (centro e tamanho em %), já dentro da área. */
export function logoBox(s: Spot, p: PlacementInput | undefined, aspect = 1) {
  const c = clampPlacement(p ?? defaultPlacement(s, aspect), s, aspect);
  return { ...c, wPct: c.w / s.cm, hPct: c.w / aspect / s.cm, hCm: Math.round((c.w / aspect) * 10) / 10 };
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
