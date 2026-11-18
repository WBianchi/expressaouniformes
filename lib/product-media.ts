// Fotos trocadas pelo painel aplicadas ao produto do catálogo.
// Posições (expressao.product_photos.slot): 0–1 pessoa vestindo (vitrine e galeria);
// 2–4 a peça sozinha de frente, costas e lado (simulador da logo e troca de cor).
import type { Product } from "./catalog.ts";

export const PHOTO_SLOTS = [
  { slot: 0, label: "Vestindo 1", piece: false },
  { slot: 1, label: "Vestindo 2", piece: false },
  { slot: 2, label: "Peça: frente", piece: true },
  { slot: 3, label: "Peça: costas", piece: true },
  { slot: 4, label: "Peça: lado", piece: true },
] as const;

/** Foto padrão (do catálogo) de cada posição. */
export const defaultPhoto = (p: Product, slot: number) => [p.photos[0], p.photos[1], p.image, p.back, p.side][slot];

/** O mínimo de produto que tem fotos (o simulador recebe só uma parte do produto). */
type WithMedia = Pick<Product, "image" | "back" | "side"> & { photos?: string[]; gallery?: string[] };

/** O produto com as fotos do painel no lugar das padrão (sem trocas = o próprio produto). */
export function withPhotos<P extends WithMedia>(p: P, o: (string | null)[] | undefined): P {
  if (!o?.some(Boolean)) return p;
  const image = o[2] ?? p.image, back = o[3] ?? p.back, side = o[4] ?? p.side;
  // só as posições 0 e 1 (vestindo, da época em que o anúncio tinha 2 fotos) trocam fotos da galeria;
  // 2–4 são a peça sozinha: com a galeria maior, elas tomavam o lugar da 3ª, 4ª e 5ª foto do anúncio
  const photos = p.photos?.map((src, i) => (i < 2 ? (o[i] ?? src) : src));
  return { ...p, image, back, side, ...(photos ? { photos, gallery: [...photos, image, back, side] } : {}) };
}
