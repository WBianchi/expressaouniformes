// Onde a logo aparece na foto do produto (prévia ilustrativa sobre as fotos reais).
// Coordenadas em % da foto quadrada: centro (x, y), largura máxima da logo (w) e rotação.
import type { Position, Product } from "./catalog.ts";

/** "side" é só foto (vista lateral), sem área de logo */
export type View = "front" | "back" | "side";
export type Spot = { view: View; x: number; y: number; w: number; h: number; rot?: number };

const BACK: Spot = { view: "back", x: 50, y: 37, w: 30, h: 26 };

/** Manga: aparece na vista lateral, sobre a parte de cima da manga. */
const sleeve = (x: number, y: number): Spot => ({ view: "side", x, y, w: 7, h: 7 });
const SLEEVE = sleeve(50, 28);

// posição da manga em cada foto lateral (medida na imagem de cada produto)
const sleeveBySlug: Record<string, Spot> = {
  "polo-pv-basica": sleeve(55, 26),
  "polo-piquet-basica": sleeve(53, 24),
  "polo-dry-fit-basica": sleeve(56, 30),
  "polo-piquet-feminina": sleeve(46, 25),
  "polo-com-friso": sleeve(52, 29),
  "polo-bicolor": sleeve(52, 27),
  "polo-gola-personalizada": sleeve(48, 29),
  "polo-manga-longa": sleeve(46, 24),
  "camisa-operacional-brim": sleeve(53, 30),
  "camiseta-algodao-basica": sleeve(46, 29),
  "camiseta-dry-fit": sleeve(46, 29),
  "camiseta-alta-visibilidade": sleeve(51, 22),
  "polo-alta-visibilidade": sleeve(50, 26),
  "dolma-chef": sleeve(46, 24),
  "jaleco-gabardine": sleeve(47, 24),
  "moletom-canguru": sleeve(52, 31),
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
    costas: { view: "back", x: 50, y: 30, w: 30, h: 16 },
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
