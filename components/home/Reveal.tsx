"use client";
import type { CSSProperties, ReactNode } from "react";
import { useInView } from "./useInView";

/**
 * Revelação ao rolar usando o contrato global (`data-reveal` → `data-reveal="in"`).
 * `delay` alimenta `--reveal-delay` para criar stagger.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
  id,
  style,
}: {
  children: ReactNode;
  className?: string;
  /** atraso em ms */
  delay?: number;
  as?: "div" | "section" | "li" | "article" | "aside";
  id?: string;
  style?: CSSProperties;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  // todos os elementos aceitos compartilham a API de HTMLElement
  const Comp = Tag as "div";
  return (
    <Comp
      ref={ref}
      id={id}
      className={className}
      data-reveal={inView ? "in" : ""}
      style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Comp>
  );
}
