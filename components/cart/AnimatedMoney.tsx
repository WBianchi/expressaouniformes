"use client";
import { useEffect, useRef, useState } from "react";
import { money } from "@/lib/catalog";
import s from "./AnimatedMoney.module.css";

/** Valor em reais que "rola" suavemente até o novo número (respeita prefers-reduced-motion). */
export function AnimatedMoney({ value, duration = 520, className }: { value: number; duration?: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const [bump, setBump] = useState(0);
  const from = useRef(value);
  const raf = useRef(0);

  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setBump((b) => b + 1);
    if (reduce) {
      from.current = value;
      setShown(value);
      return;
    }
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = start + (value - start) * eased;
      from.current = v;
      setShown(v);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else from.current = value;
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return (
    <span
      key={bump}
      className={`${s.num} ${bump ? s.bump : ""} ${className ?? ""}`}
    >
      <span aria-hidden>{money(Math.round(shown * 100) / 100)}</span>
      <span className="sr-only">{money(value)}</span>
    </span>
  );
}
