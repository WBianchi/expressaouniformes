"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import s from "./Rail.module.css";

/**
 * Carrossel horizontal com scroll-snap (toque nativo no mobile) e setas no desktop.
 * `gridFrom` transforma o trilho em grade a partir de um breakpoint (sem setas).
 */
export function Rail({
  children,
  label,
  itemWidth = "clamp(240px, 72vw, 280px)",
  gridFrom,
  columns = [4, 5, 6],
  arrows = "side",
}: {
  children: ReactNode;
  label: string;
  /** largura do item no mobile/tablet */
  itemWidth?: string;
  gridFrom?: "md" | "lg";
  /** itens visíveis em ≥1024px, ≥1440px e ≥1800px */
  columns?: [number, number, number];
  arrows?: "side" | "none";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update, children]);

  const go = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const scrollable = !(edge.start && edge.end);

  return (
    <div className={s.wrap} data-grid={gridFrom} style={{ "--item-w": itemWidth, "--cols-lg": columns[0], "--cols-xl": columns[1], "--cols-2xl": columns[2] } as CSSProperties}>
      <div ref={ref} className={s.track} role="region" aria-label={label} tabIndex={0}>
        {children}
      </div>
      {arrows === "side" && scrollable && (
        <>
          <button type="button" className={s.arrow} data-dir="prev" onClick={() => go(-1)} disabled={edge.start} aria-label="Ver anteriores">
            <ChevronLeft size={20} />
          </button>
          <button type="button" className={s.arrow} data-dir="next" onClick={() => go(1)} disabled={edge.end} aria-label="Ver próximos">
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}
