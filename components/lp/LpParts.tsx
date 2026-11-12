"use client";
import Link from "next/link";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getColor } from "@/lib/catalog";
import { Swatches } from "@/components/ui/primitives";
import s from "./Landing.module.css";

type LpColor = { color: string; setColor: (id: string) => void; tint: string | null };
const ColorCtx = createContext<LpColor | null>(null);

/** Cor escolhida na página: o seletor troca e a galeria pinta a foto da peça. */
export function LpColorProvider({ colors, children }: { colors: string[]; children: ReactNode }) {
  const [color, setColor] = useState(colors[0]);
  const tint = color === colors[0] ? null : (getColor(color)?.hex ?? null);
  return <ColorCtx.Provider value={{ color, setColor, tint }}>{children}</ColorCtx.Provider>;
}
export const useLpColor = () => useContext(ColorCtx);

/** Seletor de cor (como o "Cor: Branco" dos marketplaces) e grade de tamanhos. */
export function LpVariants({ colors, sizes }: { colors: string[]; sizes: string[] }) {
  const ctx = useLpColor();
  const [own, setOwn] = useState(colors[0]);
  const color = ctx?.color ?? own;
  const setColor = ctx?.setColor ?? setOwn;
  const [all, setAll] = useState(false);
  const shown = all ? colors : colors.slice(0, 14);
  return (
    <div className={s.variants}>
      <div>
        <p className={s.varLabel}>
          Cor: <b>{getColor(color)?.name}</b> <span className={s.varCount}>· {colors.length} cores para fabricação</span>
        </p>
        <Swatches ids={shown} value={color} onChange={setColor} size="md" />
        {colors.length > 14 && (
          <button type="button" className={s.more} onClick={() => setAll((v) => !v)}>
            {all ? "Mostrar menos cores" : `Ver todas as ${colors.length} cores`}
          </button>
        )}
      </div>
      <div>
        <p className={s.varLabel}>Tamanhos:</p>
        <ul className={s.sizeChips}>
          {sizes.map((z) => (
            <li key={z}>{z}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Barra fixa no topo ao rolar (abas da página, preço e ação), como nos marketplaces. */
export function LpStickyBar({ name, price, cta, desktopOnly }: { name: string; price: string; cta: { label: string; href: string }; desktopOnly?: boolean }) {
  const [show, setShow] = useState(false);
  const [top, setTop] = useState(0);
  useEffect(() => {
    // encaixa logo abaixo do cabeçalho do site, que encolhe ao rolar
    const on = () => {
      setShow(window.scrollY > 700);
      setTop(Math.max(0, document.querySelector("header")?.getBoundingClientRect().bottom ?? 0));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);
  return (
    <div className={s.sticky} data-show={show || undefined} data-desktop-only={desktopOnly || undefined} aria-hidden={!show} style={{ top }}>
      <div className={`container ${s.stickyInner}`}>
        <nav className={s.stickyTabs} aria-label="Seções da página">
          <a href="#descricao" tabIndex={show ? 0 : -1}>
            Descrição e ficha técnica
          </a>
          <a href="#perguntas" tabIndex={show ? 0 : -1}>
            Perguntas e respostas
          </a>
        </nav>
        <span className={s.stickyName}>{name}</span>
        <span className={s.stickyPrice}>{price}</span>
        <Link href={cta.href} className="btn btn-primary" tabIndex={show ? 0 : -1}>
          {cta.label}
        </Link>
      </div>
    </div>
  );
}
