"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ClipboardList, ShoppingBag } from "lucide-react";
import { categories, inStock, products } from "@/lib/catalog";
import { CUSTOM_MIN_QTY, STOCK_MIN_QTY } from "@/lib/quote";
import { QuoteGate } from "@/components/custom/QuoteGate";
import { ProductCard } from "@/components/ui/ProductCard";
import { SafeImage } from "@/components/ui/primitives";
import s from "./Home.module.css";

const heroPieces = ["jaleco-gabardine", "polo-pv-basica", "camisa-operacional-brim"]
  .map((slug) => products.find((p) => p.slug === slug)!)
  .filter(Boolean);

export function HomeHero() {
  const [quoteOpen, setQuoteOpen] = useState(false);
  return (
    <section className={s.hero}>
      <div className={`container ${s.heroGrid}`}>
        <div className={s.heroText}>
          <h1>Uniformes com a logo da sua empresa</h1>
          <p>Compre online a partir de {STOCK_MIN_QTY} peças ou monte o pedido da sua empresa e receba um orçamento. Fábrica própria e entrega para todo o Brasil.</p>
          <div className={s.heroActions}>
            <Link href="/loja?tipo=stock" className="btn btn-primary btn-lg">
              <ShoppingBag size={18} /> Comprar pronta-entrega
            </Link>
            <button type="button" className="btn btn-outline btn-lg" onClick={() => setQuoteOpen(true)}>
              <ClipboardList size={18} /> Solicitar orçamento
            </button>
          </div>
        </div>
        <div className={s.heroPics} aria-hidden>
          {heroPieces.map((p) => (
            <span key={p.slug} className={s.heroPic}>
              <SafeImage src={p.photos[1] ?? p.photos[0]} alt="" priority />
            </span>
          ))}
        </div>
      </div>
      <QuoteGate open={quoteOpen} onOpenChange={setQuoteOpen} />
    </section>
  );
}

export function TwoWays() {
  const [quoteOpen, setQuoteOpen] = useState(false);
  return (
    <section className={s.section} aria-labelledby="como-comprar">
      <div className="container">
        <h2 id="como-comprar" className={s.title}>
          Duas formas de comprar
        </h2>
        <div className={s.ways}>
          <article className={s.way}>
            <span className={s.wayTag}>Pronta-entrega · a partir de {STOCK_MIN_QTY} peças</span>
            <h3>Uniformes prontos para personalizar</h3>
            <p>Escolha o modelo e a cor, envie a sua logo e veja como fica na peça. Pague online e aprove o layout antes da produção.</p>
            <Link href="/loja?tipo=stock" className="btn btn-primary">
              Personalizar e comprar <ArrowRight size={17} />
            </Link>
          </article>
          <article className={s.way}>
            <span className={s.wayTag}>Para empresas · a partir de {CUSTOM_MIN_QTY} peças</span>
            <h3>Monte seu pedido e peça um orçamento</h3>
            <p>Junte vários modelos, cores e quantidades em um só pedido. Um consultor retorna com preço, prazo e layout.</p>
            <div className={s.wayActions}>
              <button type="button" className="btn btn-primary" onClick={() => setQuoteOpen(true)}>
                Solicitar orçamento <ArrowRight size={17} />
              </button>
              <Link href="/orcamento" className="btn btn-ghost">
                Montar pedido no site
              </Link>
            </div>
          </article>
        </div>
      </div>
      <QuoteGate open={quoteOpen} onOpenChange={setQuoteOpen} />
    </section>
  );
}

export function CategoryGrid() {
  const cats = categories
    .map((c) => ({ ...c, cover: products.find((p) => p.category === c.slug) }))
    .filter((c) => c.cover);
  return (
    <section className={s.section} aria-labelledby="categorias">
      <div className="container">
        <div className={s.headRow}>
          <h2 id="categorias" className={s.title}>
            Categorias
          </h2>
          <Link href="/loja" className={s.more}>
            Ver todos os produtos <ArrowRight size={15} />
          </Link>
        </div>
        <ul className={s.cats}>
          {cats.map((c) => (
            <li key={c.slug}>
              <Link href={`/loja?categoria=${c.slug}`} className={s.cat}>
                <span className={s.catImg}>
                  <SafeImage src={c.cover!.photos[0]} alt="" />
                </span>
                <span>{c.name}</span>
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
              {mode === "stock" ? "Pronta-entrega" : "Mais modelos por orçamento"}
            </h2>
            <p className={s.sub}>
              {mode === "stock"
                ? `Em estoque para comprar online, a partir de ${STOCK_MIN_QTY} peças com a sua logo.`
                : `Sem estoque ou sob encomenda: inclua no seu pedido para empresas, a partir de ${CUSTOM_MIN_QTY} peças.`}
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
