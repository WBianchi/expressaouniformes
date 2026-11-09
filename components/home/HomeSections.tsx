"use client";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { categories, inStock, products } from "@/lib/catalog";
import { CUSTOM_MIN_QTY, STOCK_MIN_QTY } from "@/lib/quote";
import { ProductCard } from "@/components/ui/ProductCard";
import { SafeImage } from "@/components/ui/primitives";
import s from "./Home.module.css";

export function CategoryGrid() {
  const rail = useRef<HTMLUListElement>(null);
  const scroll = (d: number) => {
    const el = rail.current;
    if (el) el.scrollBy({ left: d * el.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <section className={s.section} aria-labelledby="categorias">
      <div className="container">
        <div className={s.headRow}>
          <h2 id="categorias" className={s.title}>
            Categorias
          </h2>
          <div className={s.railNav}>
            <Link href="/loja" className={s.more}>
              Ver todos os produtos <ArrowRight size={15} />
            </Link>
            <button type="button" className={s.railBtn} onClick={() => scroll(-1)} aria-label="Categorias anteriores">
              <ChevronLeft size={18} />
            </button>
            <button type="button" className={s.railBtn} onClick={() => scroll(1)} aria-label="Próximas categorias">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <ul className={s.cats} ref={rail}>
          {categories.map((c) => (
            <li key={c.slug}>
              {/* o nome da categoria já vem escrito na imagem */}
              <Link href={`/loja?categoria=${c.slug}`} className={s.cat} aria-label={c.name}>
                <SafeImage src={c.image} alt={c.name} />
              </Link>
            </li>
          ))}
        </ul>
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
              {mode === "stock" ? "Pronta-entrega: compra rápida pelo site" : "Modelos de fabricação"}
            </h2>
            <p className={s.sub}>
              {mode === "stock"
                ? `Em estoque para comprar online, a partir de ${STOCK_MIN_QTY} peças com a sua logo.`
                : `Produzidos na fábrica a partir de ${CUSTOM_MIN_QTY} peças, com tecido, gola e cores do seu jeito. Orçamento com um consultor.`}
            </p>
          </div>
          <Link href={mode === "stock" ? "/loja?tipo=stock" : "/orcamento"} className={s.more}>
            {mode === "stock" ? "Ver pronta-entrega" : "Montar pedido"} <ArrowRight size={15} />
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
