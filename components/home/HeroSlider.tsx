"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { safeHref, type Banner } from "@/lib/banners";
import { QuoteGate } from "@/components/custom/QuoteGate";
import s from "./Hero.module.css";

const INTERVAL = 6500;

/**
 * Banner rotativo da home: a foto do slide aparece nítida à direita e, ao fundo,
 * a mesma foto desfocada sob um véu claro. Conteúdo editável pelo painel.
 */
export function HeroSlider({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const touch = useRef<number | null>(null);
  const count = banners.length;
  const go = useCallback((d: number) => setIndex((i) => (i + d + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => go(1), INTERVAL);
    return () => window.clearTimeout(t);
  }, [index, paused, count, go]);

  if (!count) return null;
  const current = banners[index];

  return (
    <section
      className={s.hero}
      aria-roledescription="carrossel"
      aria-label="Destaques"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <div className={s.backdrop} aria-hidden>
        {banners.map((b, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={b.id} src={b.image} alt="" data-active={i === index || undefined} loading={i === 0 ? "eager" : "lazy"} />
        ))}
        <span className={s.veil} />
      </div>

      <div className={`container ${s.inner}`}>
        <div className={s.text} key={current.id} aria-live={paused ? "polite" : "off"}>
          <h1 className={s.title}>{current.title}</h1>
          {current.subtitle && <p className={s.sub}>{current.subtitle}</p>}
          <div className={s.actions}>
            {current.ctaLabel && current.ctaHref && (
              <Link href={safeHref(current.ctaHref)} className="btn btn-primary btn-lg">
                {current.ctaLabel} <ArrowRight size={18} />
              </Link>
            )}
            <button type="button" className={`btn btn-lg ${s.ghost}`} onClick={() => setQuoteOpen(true)}>
              <ClipboardList size={18} /> Solicitar orçamento
            </button>
          </div>
        </div>

        <div className={s.photo}>
          {banners.map((b, i) => (
            <div
              key={b.id}
              className={s.slide}
              data-active={i === index || undefined}
              aria-hidden={i !== index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${count}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.image} alt={i === index ? b.title : ""} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : undefined} />
            </div>
          ))}
        </div>

        {count > 1 && (
          <div className={s.controls}>
            <button type="button" className={s.arrow} onClick={() => go(-1)} aria-label="Banner anterior">
              <ChevronLeft size={20} />
            </button>
            <div className={s.dots} role="tablist" aria-label="Escolher banner">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Banner ${i + 1}: ${b.title}`}
                  className={s.dot}
                  onClick={() => setIndex(i)}
                >
                  <span style={i === index && !paused ? { animationDuration: `${INTERVAL}ms` } : undefined} data-run={(i === index && !paused) || undefined} />
                </button>
              ))}
            </div>
            <button type="button" className={s.arrow} onClick={() => go(1)} aria-label="Próximo banner">
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
      <QuoteGate open={quoteOpen} onOpenChange={setQuoteOpen} />
    </section>
  );
}
