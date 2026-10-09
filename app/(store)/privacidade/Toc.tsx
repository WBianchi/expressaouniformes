"use client";
import { useEffect, useState } from "react";
import s from "./privacidade.module.css";

/** Índice lateral com destaque da seção visível. */
export function Toc({ items }: { items: { id: string; title: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav className={s.toc} aria-label="Índice da política de privacidade">
      <p className={s.tocTitle}>Nesta página</p>
      <ol>
        {items.map((i, n) => (
          <li key={i.id}>
            <a href={`#${i.id}`} data-active={active === i.id || undefined} aria-current={active === i.id ? "location" : undefined}>
              <span>{String(n + 1).padStart(2, "0")}</span>
              {i.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
