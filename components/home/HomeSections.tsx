"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCategoryMedia } from "@/components/store/MediaProvider";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { categories, inStock, products } from "@/lib/catalog";
import type { CategoryRows } from "@/lib/site-content";
import { CUSTOM_MIN_QTY, STOCK_MIN_QTY } from "@/lib/quote";
import { ProductCard } from "@/components/ui/ProductCard";
import { SafeImage } from "@/components/ui/primitives";
import s from "./Home.module.css";

/**
 * Categorias da home: quadros grandes, quase da largura da tela (5 por linha no computador), em 1 ou
 * 2 linhas (escolha do painel). Setas pretas nas laterais, só quando há mais quadros para aquele lado.
 */
export function CategoryGrid({ rows = 1 }: { rows?: CategoryRows }) {
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
  }, [rows]);
  const scroll = (d: number) => {
    const el = rail.current;
    if (el) el.scrollBy({ left: d * el.clientWidth * 0.8, behavior: "smooth" });
  };
  // em 2 linhas, metade das categorias em cima e o resto embaixo (a faixa rola as duas juntas)
  const cols = rows === 2 ? Math.ceil(categories.length / 2) : categories.length;
  return (
    <section className={`${s.section} ${s.catsSection}`} aria-label="Categorias">
      <div className={s.catsWrap}>
        <ul className={s.cats} ref={rail} data-rows={rows} style={{ ["--cols" as string]: cols }}>
          {categories.map((c) => {
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
          <button type="button" className={s.catNav} data-dir="prev" onClick={() => scroll(-1)} aria-label="Categorias anteriores">
            <ChevronLeft size={34} strokeWidth={2.4} />
          </button>
        )}
        {edge.next && (
          <button type="button" className={s.catNav} data-dir="next" onClick={() => scroll(1)} aria-label="Próximas categorias">
            <ChevronRight size={34} strokeWidth={2.4} />
          </button>
        )}
      </div>
      <div className={`container ${s.catsMore}`}>
        <Link href="/loja" className={s.more}>
          Ver todos os produtos <ArrowRight size={15} />
        </Link>
      </div>
    </section>
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
