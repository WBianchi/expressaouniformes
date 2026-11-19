"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCategoryMedia } from "@/components/store/MediaProvider";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { categories, inStock, products, type Category } from "@/lib/catalog";
import type { CategoryRows } from "@/lib/site-content";
import { CUSTOM_MIN_QTY, STOCK_MIN_QTY } from "@/lib/quote";
import { ProductCard } from "@/components/ui/ProductCard";
import { SafeImage } from "@/components/ui/primitives";
import s from "./Home.module.css";

/**
 * Categorias da home: quadros grandes, quase da largura da tela (5 por linha no computador), em 1 ou
 * 2 linhas (escolha do painel). Cada linha rola sozinha, com as suas setas pretas nas laterais, que só
 * aparecem quando há mais quadros para aquele lado.
 */
export function CategoryGrid({ rows = 1 }: { rows?: CategoryRows }) {
  // em 2 linhas: metade das categorias em cima e o resto embaixo
  const half = Math.ceil(categories.length / 2);
  const lines = rows === 2 ? [categories.slice(0, half), categories.slice(half)] : [categories];
  return (
    <section className={`${s.section} ${s.catsSection}`} aria-label="Categorias">
      <div className={s.catsWrap}>
        {lines.map((list, i) => (
          <CategoryRail key={i} list={list} name={lines.length > 1 ? (i ? "segunda linha de categorias" : "primeira linha de categorias") : "categorias"} />
        ))}
      </div>
      <div className={`container ${s.catsMore}`}>
        <Link href="/loja" className={s.more}>
          Ver todos os produtos <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}

/** Uma linha de categorias que rola para o lado, com a seta de cada lado. */
function CategoryRail({ list, name }: { list: Category[]; name: string }) {
  const rail = useRef<HTMLUListElement>(null);
  const catMedia = useCategoryMedia();
  // dá para rolar para trás / para frente
  const [edge, setEdge] = useState({ prev: false, next: true });
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const update = () => setEdge({ prev: el.scrollLeft > 4, next: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [list.length]);
  const scroll = (d: number) => {
    const el = rail.current;
    if (el) el.scrollBy({ left: d * el.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <div className={s.catsRow}>
      <ul className={s.cats} ref={rail}>
        {list.map((c) => {
          const m = catMedia(c);
          return (
            <li key={c.slug}>
              {/* a imagem padrão já traz o nome escrito; foto trocada no painel pode pedir o nome por cima */}
              <Link href={`/loja?categoria=${c.slug}`} className={s.cat} aria-label={c.name}>
                <SafeImage src={m.image} alt={c.name} />
                {m.showName && <span className={s.catName}>{c.name}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      {edge.prev && (
        <button type="button" className={s.catNav} data-dir="prev" onClick={() => scroll(-1)} aria-label={`Voltar na ${name}`}>
          <ChevronLeft strokeWidth={2.4} />
        </button>
      )}
      {edge.next && (
        <button type="button" className={s.catNav} data-dir="next" onClick={() => scroll(1)} aria-label={`Avançar na ${name}`}>
          <ChevronRight strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}

export function ProductSection({ mode }: { mode: "stock" | "quote" }) {
  const list = products.filter((p) => (mode === "stock" ? inStock(p) : !inStock(p))).slice(0, 8);
  if (!list.length) return null;
  return (
    <section className={s.section} aria-labelledby={`prod-${mode}`}>
      <div className="container">
        <div className={s.headRow}>
          <div>
            <h2 id={`prod-${mode}`} className={s.title}>
              {mode === "stock" ? "Pronta-entrega: compra rápida pelo site" : "Uniformes sob encomenda"}
            </h2>
            <p className={s.sub}>
              {mode === "stock"
                ? `Em estoque para comprar online, a partir de ${STOCK_MIN_QTY} peças com a sua logo.`
                : `Produzidos na fábrica a partir de ${CUSTOM_MIN_QTY} peças, com tecido, gola e cores do seu jeito. Orçamento com um consultor.`}
            </p>
          </div>
          <Link href={mode === "stock" ? "/loja?tipo=stock" : "/loja?tipo=custom"} className={s.more}>
            {mode === "stock" ? "Ver pronta-entrega" : "Ver uniformes sob encomenda"} <ArrowRight size={15} />
          </Link>
        </div>
        <div className={s.products}>
          {list.map((p, i) => (
            <ProductCard key={p.slug} product={p} priority={mode === "stock" && i < 4} />
          ))}
        </div>
      </div>
    </section>
  );
}
