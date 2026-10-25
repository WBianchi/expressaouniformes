"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { safeHref, type Banner } from "@/lib/banners";
import s from "./Hero.module.css";

const INTERVAL = 6000;

/**
 * Banner rotativo da home: imagem em tela cheia (versão desktop e celular) com
 * título, texto e botão por cima. Setas, bolinhas, arrastar no celular e
 * autoplay que pausa com o mouse em cima. Conteúdo editável pelo painel.
 */
export function HeroSlider({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const count = banners.length;
  const go = useCallback((d: number) => setIndex((i) => (i + d + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => go(1), INTERVAL);
    return () => window.clearTimeout(t);
  }, [index, paused, count, go]);

  if (!count) return null;

  return (
    <section
      className={s.hero}
      aria-roledescription="carrossel"
      aria-label="Destaques"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const t = touch.current;
        touch.current = null;
        if (!t) return;
        const dx = e.changedTouches[0].clientX - t.x;
        const dy = e.changedTouches[0].clientY - t.y;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className={s.track} style={{ transform: `translateX(-${index * 100}%)` }}>
        {banners.map((b, i) => {
          const active = i === index;
          const Title = i === 0 ? "h1" : "h2";
          return (
            <div
              key={b.id}
              className={s.slide}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${count}: ${b.title}`}
              aria-hidden={!active}
              inert={!active}
            >
              <picture>
                {b.imageMobile && <source media="(max-width: 767px)" srcSet={b.imageMobile} />}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.image}
                  alt=""
                  className={s.media}
                  data-mobile={!!b.imageMobile || undefined}
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : undefined}
                />
              </picture>
              <span className={s.scrim} aria-hidden />
              <div className={`container ${s.content}`}>
                <div className={s.copy}>
                  <Title className={s.title}>{b.title}</Title>
                  {b.subtitle && <p className={s.sub}>{b.subtitle}</p>}
                  {b.ctaLabel && b.ctaHref && (
                    <Link href={safeHref(b.ctaHref)} className={`btn btn-lg ${s.cta}`}>
                      {b.ctaLabel} <ArrowRight size={18} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button type="button" className={s.arrow} data-dir="prev" onClick={() => go(-1)} aria-label="Banner anterior">
            <ChevronLeft size={22} />
          </button>
          <button type="button" className={s.arrow} data-dir="next" onClick={() => go(1)} aria-label="Próximo banner">
            <ChevronRight size={22} />
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
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
