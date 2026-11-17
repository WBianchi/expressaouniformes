"use client";
// Proporção (largura ÷ altura) de cada logo enviada, lida da miniatura: a prévia e o controle
// de tamanho usam para manter a logo sem distorção e calcular a altura em cm.
import { useCallback, useEffect, useSyncExternalStore } from "react";

const cache = new Map<string, number>();
const pending = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;

function load(src: string) {
  if (cache.has(src) || pending.has(src) || typeof Image === "undefined") return;
  pending.add(src);
  const img = new Image();
  const done = (aspect: number) => {
    pending.delete(src);
    cache.set(src, aspect > 0 && Number.isFinite(aspect) ? aspect : 1);
    version++;
    listeners.forEach((l) => l());
  };
  img.onload = () => done(img.naturalWidth / img.naturalHeight);
  img.onerror = () => done(1);
  img.src = src;
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** Função que dá a proporção de cada logo (1 enquanto a imagem carrega). */
export function useLogoAspects(srcs: (string | null | undefined)[]) {
  const v = useSyncExternalStore(
    subscribe,
    () => version,
    () => 0,
  );
  const key = srcs.filter(Boolean).join("\n");
  useEffect(() => {
    for (const src of key.split("\n")) if (src) load(src);
  }, [key]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((src: string | null | undefined) => (src ? (cache.get(src) ?? 1) : 1), [v]);
}
