// Onde a logo aparece na foto do produto (prévia ilustrativa sobre as fotos reais).
// Coordenadas em % da foto quadrada: centro (x, y), largura máxima da logo (w) e rotação.
import type { Position, Product } from "./catalog.ts";

/** "side" é só foto (vista lateral), sem área de logo */
export type View = "front" | "back" | "side";
export type Spot = { view: View; x: number; y: number; w: number; h: number; rot?: number };

const BACK: Spot = { view: "back", x: 50, y: 33, w: 30, h: 26 };

/** Manga: aparece na vista lateral, sobre a parte de cima da manga. */
const sleeve = (x: number, y: number): Spot => ({ view: "side", x, y, w: 7, h: 7 });
const SLEEVE = sleeve(50, 28);

// posição da manga em cada foto lateral (medida na imagem de cada produto)
const sleeveBySlug: Record<string, Spot> = {
  "polo-pv-basica": sleeve(53, 29),
  "polo-piquet-basica": sleeve(53, 30),
  "polo-dry-fit-basica": sleeve(52, 29),
  "polo-piquet-feminina": sleeve(46.5, 24.5),
  "polo-com-friso": sleeve(50, 29),
  "polo-bicolor": sleeve(50, 29),
  "polo-gola-personalizada": sleeve(50, 28),
  "polo-manga-longa": sleeve(46, 27),
  "camisa-operacional-brim": sleeve(53, 31),
  "camiseta-algodao-basica": sleeve(47.5, 30),
  "camiseta-dry-fit": sleeve(49, 30),
  "camiseta-alta-visibilidade": sleeve(49, 22.5),
  "polo-alta-visibilidade": sleeve(48.5, 25),
  "dolma-chef": sleeve(46.5, 26),
  "jaleco-gabardine": sleeve(48, 25),
  "moletom-canguru": sleeve(47, 32),
};

const byCategory: Record<string, Partial<Record<Position, Spot>>> = {
  polos: {
    frente: { view: "front", x: 63, y: 34, w: 11, h: 9 },
    costas: BACK,
    manga: SLEEVE,
  },
  camisetas: {
    frente: { view: "front", x: 61, y: 31, w: 11, h: 9 },
    costas: BACK,
    manga: SLEEVE,
  },
  calcas: {
    frente: { view: "front", x: 38, y: 27, w: 8, h: 6 },
    costas: { view: "back", x: 50, y: 17, w: 16, h: 7 },
  },
  jalecos: {
    frente: { view: "front", x: 62, y: 33, w: 10, h: 8 },
    costas: BACK,
    manga: SLEEVE,
  },
  moletons: {
    frente: { view: "front", x: 50, y: 42, w: 24, h: 14 },
    costas: BACK,
    manga: SLEEVE,
  },
  operacional: {
    frente: { view: "front", x: 64, y: 34, w: 10, h: 8 },
    costas: BACK,
    manga: SLEEVE,
  },
  alimenticia: {
    frente: { view: "front", x: 63, y: 32, w: 10, h: 8 },
    costas: BACK,
    manga: SLEEVE,
  },
  "alta-visibilidade": {
    frente: { view: "front", x: 62, y: 31, w: 11, h: 8 },
    costas: { view: "back", x: 50, y: 27, w: 30, h: 16 },
    manga: SLEEVE,
  },
};

/** Onde cada posição aparece na foto da peça. */
export function logoSpots(p: Pick<Product, "category"> & { slug?: string }): Partial<Record<Position, Spot>> {
  const spots = byCategory[p.category] ?? byCategory.camisetas;
  const side = p.slug ? sleeveBySlug[p.slug] : undefined;
  return side && spots.manga ? { ...spots, manga: side } : spots;
}

export const availablePositions = (p: Pick<Product, "category">) =>
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

export function clampPlacement(p: Placement): Placement {
  return { x: round(clamp(p.x, 3, 97)), y: round(clamp(p.y, 3, 97)), s: Math.round(clamp(p.s, SCALE_MIN, SCALE_MAX) * 100) / 100 };
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
