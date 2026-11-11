// Onde a logo aparece na foto do produto (prévia ilustrativa sobre as fotos reais).
// Coordenadas em % da foto quadrada: centro (x, y), largura máxima da logo (w) e rotação.
import { getProduct, type Position, type Product } from "./catalog.ts";

/** "side" é só foto (vista lateral), sem área de logo */
export type View = "front" | "back" | "side";
/** Retângulo (em % da foto) onde a logo pode ficar: o arrastar e o tamanho não passam daqui. */
export type Area = { x0: number; x1: number; y0: number; y1: number };
export type Spot = { view: View; x: number; y: number; w: number; h: number; rot?: number; area: Area };

const area = (x0: number, x1: number, y0: number, y1: number): Area => ({ x0, x1, y0, y1 });
/** peito/frente das peças de cima */
const CHEST = area(26, 74, 20, 62);

const BACK: Spot = { view: "back", x: 50, y: 33, w: 30, h: 26, area: area(24, 76, 14, 70) };

/** Manga: aparece na vista lateral, sobre a parte de cima da manga. */
// a área é a própria manga na foto lateral (medida em cada produto): a logo não sai dela
const sleeve = (x: number, y: number, a: Area = area(40, 60, 18, 40)): Spot => ({ view: "side", x, y, w: 7, h: 7, area: a });
const SLEEVE = sleeve(50, 28);

// Ajuste fino por produto, medido nas fotos de cada peça (frente, costas e manga na
// vista lateral). O que não estiver aqui usa o padrão da categoria.
const spotsBySlug: Record<string, Partial<Record<Position, Spot>>> = {
  // o peitilho é estreito: a logo fica centralizada nele
  "avental-frontal": { frente: { view: "front", x: 50, y: 33, w: 9, h: 7, area: area(42, 58, 22, 44) } },
  "avental-bata": { frente: { view: "front", x: 59, y: 34, w: 10, h: 8, area: area(35, 65, 25, 60) } },
};

const byCategory: Record<string, Partial<Record<Position, Spot>>> = {
  polos: {
    frente: { view: "front", x: 63, y: 34, w: 11, h: 9, area: CHEST },
    costas: BACK,
    manga: SLEEVE,
  },
  camisetas: {
    frente: { view: "front", x: 61, y: 31, w: 11, h: 9, area: CHEST },
    costas: BACK,
    manga: SLEEVE,
  },
  calcas: {
    frente: { view: "front", x: 38, y: 27, w: 8, h: 6, area: area(22, 78, 12, 55) },
    costas: { view: "back", x: 50, y: 17, w: 16, h: 7, area: area(25, 75, 8, 40) },
  },
  jalecos: {
    frente: { view: "front", x: 62, y: 33, w: 10, h: 8, area: CHEST },
    costas: BACK,
    manga: SLEEVE,
  },
  moletons: {
    frente: { view: "front", x: 50, y: 42, w: 24, h: 14, area: area(25, 75, 24, 64) },
    costas: BACK,
    manga: SLEEVE,
  },
  operacional: {
    frente: { view: "front", x: 64, y: 34, w: 10, h: 8, area: CHEST },
    costas: BACK,
    manga: SLEEVE,
  },
  alimenticia: {
    frente: { view: "front", x: 63, y: 32, w: 10, h: 8, area: CHEST },
    costas: BACK,
    manga: SLEEVE,
  },
  camisas: {
    frente: { view: "front", x: 62, y: 32, w: 9, h: 7, area: CHEST },
    costas: BACK,
    manga: SLEEVE,
  },
  "alta-visibilidade": {
    frente: { view: "front", x: 62, y: 31, w: 11, h: 8, area: CHEST },
    costas: { view: "back", x: 50, y: 27, w: 30, h: 16, area: area(26, 74, 14, 44) },
    manga: SLEEVE,
  },
};

/** Onde cada posição aparece na foto da peça (sem as posições que a peça não tem). */
export function logoSpots(p: Pick<Product, "category"> & { slug?: string }): Partial<Record<Position, Spot>> {
  const spots = { ...(byCategory[p.category] ?? byCategory.camisetas), ...(p.slug ? spotsBySlug[p.slug] : undefined) };
  for (const pos of (p.slug && getProduct(p.slug)?.noPositions) || []) delete spots[pos];
  return spots;
}

export const availablePositions = (p: Pick<Product, "category"> & { slug?: string }) =>
  (["frente", "costas", "manga"] as Position[]).filter((pos) => !!logoSpots(p)[pos]);

/** Vista que mostra melhor as posições escolhidas: frente, a menos que nenhuma esteja nela. */
export function bestView(p: Pick<Product, "category"> & { slug?: string }, positions: Position[]): View {
  const spots = logoSpots(p);
  const views = positions.map((pos) => spots[pos]?.view).filter((v): v is View => !!v);
  return !views.length || views.includes("front") ? "front" : views[0];
}

/** Posição e tamanho escolhidos pelo cliente arrastando a logo na prévia (centro em %, escala). */
export type Placement = { x: number; y: number; s: number };
export type Placements = Partial<Record<Position, Placement>>;

export const SCALE_MIN = 0.5;
export const SCALE_MAX = 2;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round = (n: number) => Math.round(n * 10) / 10;

/** Maior escala em que a logo ainda cabe na área permitida. */
export function maxScale(spot: Pick<Spot, "w" | "h" | "area">) {
  const { x0, x1, y0, y1 } = spot.area;
  return Math.max(SCALE_MIN, Math.min(SCALE_MAX, (x1 - x0) / spot.w, (y1 - y0) / spot.h));
}

/**
 * Mantém a logo dentro da área da posição (ex.: a da manga não sai da manga),
 * limitando o tamanho e o centro. Sem `spot`, só mantém dentro da foto.
 */
export function clampPlacement(p: Placement, spot?: Pick<Spot, "w" | "h" | "area">): Placement {
  if (!spot) return { x: round(clamp(p.x, 3, 97)), y: round(clamp(p.y, 3, 97)), s: Math.round(clamp(p.s, SCALE_MIN, SCALE_MAX) * 100) / 100 };
  const s = Math.floor(clamp(p.s, SCALE_MIN, maxScale(spot)) * 100) / 100;
  const hw = (spot.w * s) / 2;
  const hh = (spot.h * s) / 2;
  const { x0, x1, y0, y1 } = spot.area;
  return { x: round(clamp(p.x, x0 + hw, x1 - hw)), y: round(clamp(p.y, y0 + hh, y1 - hh)), s };
}

/** Área da logo com o ajuste do cliente aplicado (sem ajuste, a posição padrão). */
export function placedSpot(spot: Spot, placement?: Placement): Spot {
  if (!placement) return spot;
  return { ...spot, x: placement.x, y: placement.y, w: spot.w * placement.s, h: spot.h * placement.s };
}

export const isPlacement = (v: unknown): v is Placement => {
  const p = v as Placement;
  return !!p && [p.x, p.y, p.s].every((n) => typeof n === "number" && Number.isFinite(n)) && p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100 && p.s >= SCALE_MIN && p.s <= SCALE_MAX;
};
