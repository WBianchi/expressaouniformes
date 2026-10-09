"use client";
import { useEffect, useRef, useState, type DependencyList, type ReactNode, type RefObject } from "react";
import { money } from "@/lib/catalog";

/** Observa elementos com `data-reveal` dentro de `ref` e troca para `data-reveal="in"` ao entrarem na tela. */
export function useReveal(ref: RefObject<HTMLElement | null>, deps: DependencyList = []) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal="in"])');
    if (typeof IntersectionObserver === "undefined") {
      els.forEach((e) => e.setAttribute("data-reveal", "in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute("data-reveal", "in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Wrapper para páginas de servidor: ativa a revelação ao rolar nos filhos com `data-reveal`. */
export function RevealRoot({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Valor numérico animado (tween curto) — usado na calculadora de preço. */
export function AnimatedNumber({ value, format = money, duration = 450 }: { value: number; format?: (n: number) => string; duration?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reduced()) {
      setShown(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - k, 3);
      const v = a + (value - a) * e;
      setShown(v);
      from.current = v;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{format(Math.round(shown * 100) / 100)}</span>;
}
