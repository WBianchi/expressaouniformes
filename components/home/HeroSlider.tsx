"use client";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, MessageCircle, Package, Pause, Play, Sparkles, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { money, stockProducts, whatsappLink } from "@/lib/catalog";
import { BannerImage } from "./BannerImage";
import { usePrefersReducedMotion } from "./useInView";
import s from "./HeroSlider.module.css";

const DURATION = 6500;
const fromPrice = Math.min(...stockProducts.map((p) => p.price));

type Slide = {
  id: string;
  tone: "brand" | "gold" | "cyan";
  eyebrow: { icon: ReactNode; label: string; kind: "success" | "brand" | "gold" };
  title: string;
  text: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string; external?: boolean };
  highlight: { label: string; value: string; hint: string };
};

const slides: Slide[] = [
  {
    id: "pronta-entrega",
    tone: "brand",
    eyebrow: { icon: <Package size={14} />, label: "Pronta-entrega", kind: "success" },
    title: "Sua marca no uniforme em poucos dias",
    text: "Modelos em estoque a partir de 5 peças. Envie sua logo, aprove o layout online e receba em todo o Brasil.",
    primary: { label: "Personalizar agora", href: "/loja?tipo=stock" },
    secondary: { label: "Como funciona", href: "#como-funciona" },
    highlight: { label: "Peças a partir de", value: money(fromPrice), hint: "por unidade, lisa" },
  },
  {
    id: "sob-medida",
    tone: "cyan",
    eyebrow: { icon: <Sparkles size={14} />, label: "Para empresas", kind: "brand" },
    title: "Uniformes sob medida com a identidade da sua empresa",
    text: "Tecido, gola, punho, frisos e cores definidos com um consultor. Produção própria a partir de 30 peças.",
    primary: { label: "Desenvolver meu uniforme", href: "/sob-medida" },
    secondary: { label: "Falar com um consultor", href: whatsappLink("Olá! Quero desenvolver uniformes sob medida para minha empresa."), external: true },
    highlight: { label: "Pedido mínimo", value: "30 peças", hint: "atendimento consultivo" },
  },
  {
    id: "eventos",
    tone: "gold",
    eyebrow: { icon: <Users size={14} />, label: "Eventos, igrejas e grupos", kind: "gold" },
    title: "Camisetas para o seu evento a partir de 5 peças",
    text: "Retiros, corridas, confraternizações e ações de marca. Grade do PP ao XGG e 5% de desconto no Pix.",
    primary: { label: "Ver camisetas", href: "/loja?categoria=camisetas" },
    secondary: { label: "Pedir orçamento", href: whatsappLink("Olá! Quero um orçamento de camisetas personalizadas para um evento."), external: true },
    highlight: { label: "Grade completa", value: "PP ao XGG", hint: "DTF, silk ou bordado" },
  },
];

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const reduced = usePrefersReducedMotion();
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback((i: number) => setIndex((i + slides.length) % slides.length), []);
  const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  const autoplay = !reduced && !userPaused;
  const paused = hovered || focused || hidden || userPaused;

  return (
    <section
      className={s.hero}
      aria-roledescription="carrossel"
      aria-label="Destaques da Expressão Uniformes"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
      }}
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        const t = touch.current;
        touch.current = null;
        if (!t) return;
        const dx = e.changedTouches[0].clientX - t.x;
        const dy = e.changedTouches[0].clientY - t.y;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
      }}
      style={{ "--hero-dur": `${DURATION}ms` } as CSSProperties}
      data-paused={paused || undefined}
    >
      <div className={s.viewport} aria-live={autoplay && !paused ? "off" : "polite"}>
        {slides.map((slide, i) => {
          const active = i === index;
          const n = i + 1;
          return (
            <div
              key={slide.id}
              className={s.slide}
              data-active={active || undefined}
              role="group"
              aria-roledescription="slide"
              aria-label={`${n} de ${slides.length}: ${slide.title}`}
              aria-hidden={!active}
              inert={!active}
            >
              <BannerImage
                src={`/images/banners/hero-${n}.webp`}
                mobileSrc={`/images/banners/hero-${n}-mobile.webp`}
                alt=""
                priority={i === 0}
                tone={slide.tone}
                className={s.media}
              />
              <span className={s.scrim} aria-hidden />
              <div className={s.content}>
                <span className={s.eyebrow} data-kind={slide.eyebrow.kind}>
                  {slide.eyebrow.icon}
                  {slide.eyebrow.label}
                </span>
                {i === 0 ? <h1 className={s.title}>{slide.title}</h1> : <h2 className={s.title}>{slide.title}</h2>}
                <p className={s.text}>{slide.text}</p>
                <div className={s.ctas}>
                  <Link href={slide.primary.href} className="btn btn-accent btn-lg">
                    {slide.primary.label} <ArrowRight size={18} />
                  </Link>
                  {slide.secondary.external ? (
                    <a href={slide.secondary.href} target="_blank" rel="noopener noreferrer" className={`btn btn-lg ${s.ghost}`}>
                      <MessageCircle size={18} /> {slide.secondary.label}
                    </a>
                  ) : (
                    <Link href={slide.secondary.href} className={`btn btn-lg ${s.ghost}`}>
                      {slide.secondary.label}
                    </Link>
                  )}
                </div>
              </div>
              <div className={s.highlight} aria-hidden={!active}>
                <small>{slide.highlight.label}</small>
                <strong>{slide.highlight.value}</strong>
                <span>{slide.highlight.hint}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={s.controls}>
        <div className={s.dots} role="tablist" aria-label="Escolher destaque">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Ir para o destaque ${i + 1}: ${slide.eyebrow.label}`}
              className={s.dot}
              data-active={i === index || undefined}
              onClick={() => go(i)}
            >
              {i === index && autoplay && (
                <span key={`${index}-${slide.id}`} className={s.progress} onAnimationEnd={next} />
              )}
            </button>
          ))}
        </div>
        <div className={s.arrows}>
          {!reduced && (
            <button
              type="button"
              className={s.ctrl}
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? "Retomar rotação automática" : "Pausar rotação automática"}
            >
              {userPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}
          <button type="button" className={s.ctrl} onClick={prev} aria-label="Destaque anterior">
            <ChevronLeft size={20} />
          </button>
          <button type="button" className={s.ctrl} onClick={next} aria-label="Próximo destaque">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
