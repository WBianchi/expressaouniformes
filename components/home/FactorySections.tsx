"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Factory, ShoppingBag } from "lucide-react";
import { artTechniques, fabricOptions } from "@/lib/qualify";
import { CUSTOM_MIN_QTY, STOCK_MIN_QTY } from "@/lib/quote";
import type { ClientLogo } from "@/lib/site-media";
import { QuoteGate } from "@/components/custom/QuoteGate";
import s from "./Home.module.css";

const techniques = artTechniques.filter((t) => t.id !== "nao-sei");

/** Os dois caminhos de compra, bem separados: poucas peças no site × fabricação com consultor. */
export function TwoPaths({ product, compact }: { product?: string; compact?: boolean }) {
  const [quoteOpen, setQuoteOpen] = useState(false);
  return (
    <section className={s.section} aria-labelledby="dois-caminhos">
      <div className="container">
        <h2 id="dois-caminhos" className={s.title}>
          Dois jeitos de comprar, conforme a quantidade
        </h2>
        <p className={s.sub}>Pedidos pequenos saem rápido pelo site. Pedidos maiores viram fabricação, com atendimento especializado.</p>
        <div className={s.ways}>
          <article className={s.way}>
            <span className={s.wayTag}>
              <ShoppingBag size={15} /> De {STOCK_MIN_QTY} a {CUSTOM_MIN_QTY - 1} peças · compra rápida
            </span>
            <h3>Monte, simule e compre pelo site</h3>
            <ul className={s.wayList}>
              <li>
                <Check size={15} /> Modelos prontos em estoque, várias cores e tamanhos
              </li>
              <li>
                <Check size={15} /> Envie sua logo e veja como fica na peça
              </li>
              <li>
                <Check size={15} /> Aplicação em silk, bordado, DTF ou sublimação
              </li>
              <li>
                <Check size={15} /> Pague online e acompanhe o prazo de entrega, sem esperar vendedor
              </li>
            </ul>
            <Link href={product ? `/produto/${product}` : "/loja?tipo=stock"} className="btn btn-primary">
              Abrir o simulador <ArrowRight size={17} />
            </Link>
          </article>
          <article className={s.way} data-tone="factory">
            <span className={s.wayTag}>
              <Factory size={15} /> {CUSTOM_MIN_QTY} peças ou mais · fabricação
            </span>
            <h3>Fabricação com consultor</h3>
            <ul className={s.wayList}>
              <li>
                <Check size={15} /> Tudo da compra rápida, com preço de fábrica pelo volume
              </li>
              <li>
                <Check size={15} /> Peça do seu jeito: tecido, gola, botões, frisos, cores e recortes
              </li>
              <li>
                <Check size={15} /> Vários modelos no mesmo pedido
              </li>
              <li>
                <Check size={15} /> Atendimento especializado do orçamento à entrega
              </li>
            </ul>
            <div className={s.wayActions}>
              <button type="button" className="btn btn-primary" onClick={() => setQuoteOpen(true)}>
                Falar com um consultor <ArrowRight size={17} />
              </button>
              {!compact && (
                <Link href="/orcamento" className="btn btn-ghost">
                  Montar pedido no site
                </Link>
              )}
            </div>
          </article>
        </div>
      </div>
      <QuoteGate open={quoteOpen} onOpenChange={setQuoteOpen} product={product} />
    </section>
  );
}

/** Reforço de marca: compra direto de uma fábrica especializada. */
export function FactoryStrip() {
  return (
    <section className={`${s.section} ${s.factory}`} aria-labelledby="direto-fabrica">
      <div className="container">
        <span className={s.eyebrow}>
          <Factory size={15} /> Fábrica própria
        </span>
        <h2 id="direto-fabrica" className={s.title}>
          Você compra direto de uma fábrica especializada em uniformes
        </h2>
        <p className={s.sub}>Sem intermediário: a mesma equipe produz a peça e aplica a sua marca.</p>
        <div className={s.factoryGrid}>
          <div>
            <h3 className={s.factoryHead}>Sua logo na peça</h3>
            <p className={s.factoryNote}>Em qualquer quantidade, a partir de {STOCK_MIN_QTY} peças.</p>
            <ul className={s.techList}>
              {techniques.map((t) => (
                <li key={t.id}>
                  <b>{t.label}</b>
                  <small>{t.hint}</small>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className={s.factoryHead}>A peça do seu jeito</h3>
            <p className={s.factoryNote}>Exclusivo da fabricação, a partir de {CUSTOM_MIN_QTY} peças.</p>
            <ul className={s.chipList}>
              {fabricOptions.map((o) => (
                <li key={o.id}>{o.label}</li>
              ))}
              <li>Modelagem</li>
              <li>Etiqueta</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/** "Empresas que confiam": só logos autorizadas, cadastradas no painel. Some quando vazia. */
export function ClientLogos({ logos }: { logos: ClientLogo[] }) {
  if (!logos.length) return null;
  return (
    <section className={s.section} aria-labelledby="clientes">
      <div className="container">
        <h2 id="clientes" className={s.title}>
          Empresas que vestem Expressão
        </h2>
        <ul className={s.clients}>
          {logos.map((l) => (
            <li key={l.id} title={l.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.image} alt={l.name} loading="lazy" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
