"use client";
import { useEffect, useRef, useState } from "react";
import s from "./BannerImage.module.css";

/**
 * Imagem de banner responsiva (<picture>) com fallback elegante:
 * gradiente da marca + pattern, enquanto o arquivo não existe ou carrega.
 */
export function BannerImage({
  src,
  mobileSrc,
  alt,
  priority,
  tone = "brand",
  className,
}: {
  src: string;
  mobileSrc?: string;
  alt: string;
  priority?: boolean;
  tone?: "brand" | "gold" | "cyan";
  className?: string;
}) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const img = useRef<HTMLImageElement>(null);
  // imagem já em cache (carregou antes da hidratação)
  useEffect(() => {
    const el = img.current;
    if (el?.complete && el.naturalWidth) setState("ok");
  }, []);
  return (
    <span className={`${s.media} ${className ?? ""}`} data-state={state} data-tone={tone}>
      <span className={s.fallback} aria-hidden>
        <span className={s.orb} />
        <span className={s.orb2} />
      </span>
      {state !== "error" && (
        <picture>
          {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSrc} />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            onLoad={() => setState("ok")}
            onError={() => setState("error")}
            ref={img}
          />
        </picture>
      )}
    </span>
  );
}
