"use client";
// Fotos de vitrine trocadas pelo painel (lidas no servidor e repassadas aqui).
import { createContext, useCallback, useContext } from "react";
import type { PhotoOverrides } from "@/lib/banners";
import type { Product } from "@/lib/catalog";

const MediaContext = createContext<PhotoOverrides>({});

export function MediaProvider({ photos, children }: { photos: PhotoOverrides; children: React.ReactNode }) {
  return <MediaContext.Provider value={photos}>{children}</MediaContext.Provider>;
}

/** Retorna uma função que dá as fotos de vitrine do produto, já com as trocas do painel. */
export function useProductPhotos() {
  const overrides = useContext(MediaContext);
  return useCallback(
    (p: Product) => {
      const o = overrides[p.slug];
      return o ? p.photos.map((src, i) => o[i] ?? src) : p.photos;
    },
    [overrides],
  );
}
