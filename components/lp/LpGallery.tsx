"use client";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/primitives";
import s from "./Landing.module.css";

/**
 * Galeria da landing page (estilo marketplace): foto principal grande e miniaturas
 * ao lado. Modelo vestindo a peça (frente e costas) e a peça sozinha (frente, costas, lado).
 */
export function LpGallery({ images, name }: { images: { src: string; label: string }[]; name: string }) {
  const [i, setI] = useState(0);
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
            <SafeImage src={im.src} alt={`${name}: ${im.label}`} priority={k === 0} />
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
              <SafeImage src={im.src} alt="" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
