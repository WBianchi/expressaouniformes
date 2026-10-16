// Onde a logo aparece na foto do produto (prévia ilustrativa sobre as fotos reais).
// Coordenadas em % da foto quadrada: centro (x, y), largura máxima da logo (w) e rotação.
import type { Position, Product } from "./catalog.ts";

export type View = "front" | "back";
export type Spot = { view: View; x: number; y: number; w: number; h: number; rot?: number };

const BACK: Spot = { view: "back", x: 50, y: 37, w: 30, h: 26 };

const byCategory: Record<string, Partial<Record<Position, Spot>>> = {
  polos: {
    frente: { view: "front", x: 63, y: 34, w: 11, h: 9 },
    costas: BACK,
    manga: { view: "front", x: 80.5, y: 36, w: 6, h: 6, rot: 20 },
  },
  camisetas: {
    frente: { view: "front", x: 61, y: 31, w: 11, h: 9 },
    costas: BACK,
    manga: { view: "front", x: 80, y: 34, w: 6, h: 6, rot: 18 },
  },
  calcas: {
    frente: { view: "front", x: 38, y: 27, w: 8, h: 6 },
    costas: { view: "back", x: 50, y: 17, w: 16, h: 7 },
  },
  jalecos: {
    frente: { view: "front", x: 62, y: 33, w: 10, h: 8 },
    costas: BACK,
    manga: { view: "front", x: 82, y: 38, w: 5.5, h: 5.5, rot: 14 },
  },
  moletons: {
    frente: { view: "front", x: 50, y: 42, w: 24, h: 14 },
    costas: BACK,
    manga: { view: "front", x: 83, y: 46, w: 6, h: 6, rot: 12 },
  },
  operacional: {
    frente: { view: "front", x: 64, y: 34, w: 10, h: 8 },
    costas: BACK,
    manga: { view: "front", x: 82, y: 37, w: 6, h: 6, rot: 18 },
  },
  alimenticia: {
    frente: { view: "front", x: 63, y: 32, w: 10, h: 8 },
    costas: BACK,
    manga: { view: "front", x: 82, y: 38, w: 5.5, h: 5.5, rot: 14 },
  },
  "alta-visibilidade": {
    frente: { view: "front", x: 62, y: 31, w: 11, h: 8 },
    costas: { view: "back", x: 50, y: 30, w: 30, h: 16 },
    manga: { view: "front", x: 80, y: 34, w: 6, h: 6, rot: 18 },
  },
};

/** Posições disponíveis para a peça, na ordem de exibição. */
export function logoSpots(p: Pick<Product, "category">): Partial<Record<Position, Spot>> {
  return byCategory[p.category] ?? byCategory.camisetas;
}

export const availablePositions = (p: Pick<Product, "category">) =>
  (["frente", "costas", "manga"] as Position[]).filter((pos) => !!logoSpots(p)[pos]);

/** Vista que mostra melhor as posições escolhidas: frente, a menos que só haja costas. */
export function bestView(p: Pick<Product, "category">, positions: Position[]): View {
  const spots = logoSpots(p);
  const views = positions.map((pos) => spots[pos]?.view).filter(Boolean);
  return views.length && views.every((v) => v === "back") ? "back" : "front";
}
