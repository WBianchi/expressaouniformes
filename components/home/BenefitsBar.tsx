"use client";
// Barra de condições embaixo do banner da home ("Compra 100% segura", "Frete grátis acima de…").
// Computador: todas lado a lado. Celular: uma por vez, numa linha só, passando sozinha, com as
// setas nos cantos da barra (e arrastar com o dedo). Ícones e textos editados no painel
// (Banners → Barra de condições).
import { useEffect, useRef, useState } from "react";
import {
  Award,
  BadgePercent,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Factory,
  Gift,
  Headset,
  Package,
  ShieldCheck,
  Shirt,
  Star,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { BenefitIcon, Benefits } from "@/lib/site-content";
import s from "./BenefitsBar.module.css";

const ICONS: Record<BenefitIcon, LucideIcon> = {
  percent: BadgePercent,
  shield: ShieldCheck,
  card: CreditCard,
  truck: Truck,
  factory: Factory,
  clock: Clock,
  award: Award,
  headset: Headset,
  package: Package,
  shirt: Shirt,
  gift: Gift,
  star: Star,
};

/** No celular, tempo de cada condição na tela. */
const INTERVAL = 4000;
const SMALL = "(max-width: 767px)";

export function BenefitIconView({ icon, size = 24 }: { icon: BenefitIcon; size?: number }) {
  const Icon = ICONS[icon] ?? Star;
  return <Icon size={size} strokeWidth={1.5} aria-hidden />;
}

export function BenefitsBar({ benefits }: { benefits: Benefits }) {
  const items = benefits.items;
  const n = items.length;
  const [index, setIndex] = useState(0);
  const [small, setSmall] = useState(false);
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);
  const cur = n ? index % n : 0;
  const go = (d: number) => setIndex((i) => (i + d + n) % n);

  useEffect(() => {
    const mq = window.matchMedia(SMALL);
    const update = () => setSmall(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // passa sozinha no celular (pausa enquanto o dedo está na barra)
  useEffect(() => {
    if (!small || paused || n < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % n), INTERVAL);
    return () => window.clearTimeout(t);
  }, [small, paused, n, index]);

  if (!benefits.active || !n) return null;

  return (
    <section
      className={s.bar}
      aria-label="Condições da loja"
      onTouchStart={(e) => {
        touch.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        const start = touch.current;
        touch.current = null;
        setPaused(false);
        if (start === null) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className={`container ${s.viewport}`}>
        <ul className={s.list} data-count={n} style={{ ["--i" as string]: cur }}>
          {items.map((b, i) => (
            <li key={i} aria-hidden={small && i !== cur ? true : undefined}>
              <BenefitIconView icon={b.icon} />
              <span>{b.text}</span>
            </li>
          ))}
        </ul>
      </div>
      {n > 1 && (
        <>
          <button type="button" className={s.nav} data-dir="prev" onClick={() => go(-1)} aria-label="Condição anterior">
            <ChevronLeft size={22} strokeWidth={2} />
          </button>
          <button type="button" className={s.nav} data-dir="next" onClick={() => go(1)} aria-label="Próxima condição">
            <ChevronRight size={22} strokeWidth={2} />
          </button>
        </>
      )}
    </section>
  );
}
