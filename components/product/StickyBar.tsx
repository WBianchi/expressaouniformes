"use client";
import { useEffect, useState, type ReactNode, type RefObject } from "react";
import s from "./Product.module.css";

/** Barra de compra fixa (mobile) que aparece quando o bloco de ações sai da tela por cima. */
export function StickyBar({ watch, children }: { watch: RefObject<HTMLElement | null>; children: ReactNode }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = watch.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // desconta o header fixo (até ~96px no mobile) para considerar o bloco "fora da tela"
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 96), {
      threshold: 0,
      rootMargin: "-96px 0px 0px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [watch]);
  return (
    <div className={s.sticky} data-show={show || undefined} aria-hidden={!show} inert={!show}>
      {children}
    </div>
  );
}
