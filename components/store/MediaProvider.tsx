"use client";
// Fotos trocadas pelo painel (lidas no servidor e repassadas aqui): vitrine e peça sozinha.
import { createContext, useCallback, useContext } from "react";
import type { PhotoOverrides } from "@/lib/banners";
import type { Product } from "@/lib/catalog";
import { withPhotos } from "@/lib/product-media";

const MediaContext = createContext<PhotoOverrides>({});

export function MediaProvider({ photos, children }: { photos: PhotoOverrides; children: React.ReactNode }) {
  return <MediaContext.Provider value={photos}>{children}</MediaContext.Provider>;
}

/** Retorna uma função que dá as fotos de vitrine do produto, já com as trocas do painel. */
export function useProductPhotos() {
  const media = useProductMedia();
  return useCallback((p: Product) => media(p).photos, [media]);
}

/** Retorna uma função que dá o produto com todas as fotos do painel (vitrine e peça sozinha). */
export function useProductMedia() {
  const overrides = useContext(MediaContext);
  return useCallback(<P extends Parameters<typeof withPhotos>[0] & { slug?: string }>(p: P) => withPhotos(p, p.slug ? overrides[p.slug] : undefined), [overrides]);
}
