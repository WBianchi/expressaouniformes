"use client";
// Contorno da peça de cada foto do simulador: a logo não sai da peça ao arrastar nem ao aumentar.
// Lido uma vez por foto (a máscara é a mesma da troca de cor) e guardado.
import { useEffect, useState } from "react";
import { buildFitMap, fitsInside, type FitMap } from "@/lib/fit-map";
import type { Fits } from "@/lib/mockup";
import { pieceMask } from "@/lib/recolor";

const maps = new Map<string, Promise<FitMap | null>>();
const load = (src: string) => {
  let p = maps.get(src);
  if (!p) {
    p = pieceMask(src)
      .then(({ w, h, m }) => buildFitMap(m, w, h))
      .catch(() => null);
    maps.set(src, p);
  }
  return p;
};

/** Teste "cabe na peça" da foto; indefinido enquanto lê a foto (ou se não der para medir). */
export function usePieceFit(src: string | null | undefined): Fits | undefined {
  const [state, setState] = useState<{ src: string; fits?: Fits } | null>(null);
  useEffect(() => {
    if (!src) return;
    let live = true;
    load(src).then((map) => live && setState({ src, fits: map ? (a) => fitsInside(map, a) : undefined }));
    return () => {
      live = false;
    };
  }, [src]);
  return state && state.src === src ? state.fits : undefined;
}
