"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/primitives";
import { useRecolored } from "@/lib/recolor";
import { useLpColor } from "./LpParts";
import s from "./Landing.module.css";

type LpImage = { src: string; label: string; /** foto da peça sozinha: muda de cor com o seletor */ piece?: boolean };

/** Foto da peça pintada na cor escolhida (a da pessoa vestindo fica como está). */
function Photo({ im, alt, priority, tint }: { im: LpImage; alt: string; priority?: boolean; tint: string | null }) {
  const src = useRecolored(im.src, im.piece ? tint : null);
  return <SafeImage src={src} alt={alt} priority={priority} />;
}

/**
 * Galeria da landing page (estilo marketplace): foto principal grande e miniaturas
 * embaixo. Modelo vestindo a peça (frente e costas) e a peça sozinha (frente, costas, lado).
 */
export function LpGallery({ images, name }: { images: LpImage[]; name: string }) {
  const [i, setI] = useState(0);
  const tint = useLpColor()?.tint ?? null;
  // ao escolher outra cor, mostra a peça sozinha (é ela que muda de cor)
  useEffect(() => {
    if (!tint) return;
    setI((cur) => (images[cur]?.piece ? cur : Math.max(0, images.findIndex((im) => im.piece))));
  }, [tint, images]);
  const touch = useRef<number | null>(null);
  const go = (d: number) => setI((cur) => (cur + d + images.length) % images.length);
  const current = images[i];

  return (
    <div className={s.gallery}>
      <div
        className={s.stage}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        {images.map((im, k) => (
          <div key={im.src} className={s.slide} data-active={k === i || undefined} aria-hidden={k !== i}>
            <Photo im={im} alt={`${name}: ${im.label}`} priority={k === 0} tint={tint} />
          </div>
        ))}
        <span className={s.counter}>
          {i + 1}/{images.length} · {current.label}
        </span>
        <button type="button" className={s.nav} data-dir="prev" onClick={() => go(-1)} aria-label="Foto anterior">
          <ChevronLeft size={20} />
        </button>
        <button type="button" className={s.nav} data-dir="next" onClick={() => go(1)} aria-label="Próxima foto">
          <ChevronRight size={20} />
        </button>
      </div>
      <ul className={s.thumbs} aria-label="Fotos do produto">
        {images.map((im, k) => (
          <li key={im.src}>
            <button
              type="button"
              className={s.thumb}
              aria-current={k === i || undefined}
              aria-label={`Ver foto ${k + 1}: ${im.label}`}
              onMouseEnter={() => setI(k)}
              onFocus={() => setI(k)}
              onClick={() => setI(k)}
            >
              <Photo im={im} alt="" tint={tint} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
