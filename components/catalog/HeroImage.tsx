"use client";
import { useState } from "react";

/** Imagem de fundo com cadeia de alternativas; se nenhuma existir, não renderiza (fica o gradiente/pattern). */
export function HeroImage({ sources, className }: { sources: string[]; className?: string }) {
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);
  if (i >= sources.length) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={sources[i]}
      src={sources[i]}
      alt=""
      className={className}
      data-loaded={loaded || undefined}
      fetchPriority="high"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setI((n) => n + 1)}
      ref={(el) => {
        if (!el?.complete) return;
        if (el.naturalWidth) setLoaded(true);
        else if (el.currentSrc) setI((n) => (sources[n] === sources[i] ? n + 1 : n)); // falhou antes da hidratação
      }}
    />
  );
}
