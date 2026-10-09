"use client";
import { useEffect, useRef, useState } from "react";

type Options = {
  /** dispara só na primeira vez que entra na viewport (padrão: true) */
  once?: boolean;
  threshold?: number;
  rootMargin?: string;
};

/** Observa quando um elemento entra na viewport (IntersectionObserver). */
export function useInView<T extends Element = HTMLDivElement>({ once = true, threshold = 0.15, rootMargin = "0px 0px -8% 0px" }: Options = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, threshold, rootMargin]);

  return [ref, inView] as const;
}

/** true quando o usuário pediu menos movimento. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}
