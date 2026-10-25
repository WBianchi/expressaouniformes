"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { ClipboardList, MessageCircle } from "lucide-react";
import { getColor, whatsappLink, type Product } from "@/lib/catalog";
import { CUSTOM_MIN_QTY } from "@/lib/quote";
import { useQuote } from "@/components/quote/useQuote";
import { Stepper, Swatches } from "@/components/ui/primitives";
import { Personalize, type PersonalizeProps } from "./Personalize";
import { ProductHead } from "./ProductHead";
import { StickyBar } from "./StickyBar";
import s from "./Product.module.css";

/** Itens sem estoque ou sob encomenda: entram no orçamento para empresas (30+ peças no pedido). */
export function QuoteBuyBox({ product, positions, onPositions, logos, onLogo }: PersonalizeProps & { product: Product }) {
  const { add, items, total } = useQuote();
  const [color, setColor] = useState(product.colors[0]);
  const [qty, setQty] = useState(CUSTOM_MIN_QTY);
  const actionsRef = useRef<HTMLDivElement>(null);
  const colorName = getColor(color)?.name ?? "";
  const inQuote = items.some((i) => i.slug === product.slug);
  const outOfStock = product.kind === "stock";

  const addToQuote = () => add({ slug: product.slug, color, qty, positions });
  const wa = whatsappLink(
    `Olá! Quero um orçamento de ${qty} peças de ${product.name} (${colorName.toLowerCase()})${positions.length ? ` com logo (${positions.join(", ")})` : ""}.`,
  );

  return (
    <div className={s.buy}>
      <ProductHead product={product} />

      <div className={s.quoteNotice}>
        <b>{outOfStock ? "Sob cotação" : "Sob encomenda"}</b>
        <p>
          {outOfStock ? "Este modelo não está disponível para compra online agora. " : ""}
          Inclua no seu orçamento para empresas: pedidos a partir de {CUSTOM_MIN_QTY} peças no total, podendo misturar modelos, cores e tamanhos.
        </p>
      </div>

      <section className={s.step} aria-labelledby="qb-color">
        <h2 id="qb-color" className={s.stepTitle}>
          <span className={s.stepNum}>1</span> Cor <span className={s.stepValue}>{colorName}</span>
        </h2>
        <Swatches ids={product.colors} value={color} onChange={setColor} size="lg" />
        <p className={s.note}>Outras cores sob consulta.</p>
      </section>

      <section className={s.step} aria-labelledby="qb-qty">
        <h2 id="qb-qty" className={s.stepTitle}>
          <span className={s.stepNum}>2</span> Quantidade estimada
        </h2>
        <div className={s.qtyRow}>
          <Stepper value={qty} onChange={(n) => setQty(Math.max(1, n))} max={100000} label="quantidade" />
          <span className={s.muted}>peças · a grade de tamanhos é definida com o consultor</span>
        </div>
      </section>

      <Personalize product={product} positions={positions} onPositions={onPositions} logos={logos} onLogo={onLogo} fees={false} step={3} />

      <div className={s.actions} ref={actionsRef}>
        <button type="button" className="btn btn-primary btn-lg btn-block" onClick={addToQuote}>
          <ClipboardList size={18} /> Adicionar ao orçamento
        </button>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-lg btn-block">
          <MessageCircle size={18} /> Falar com um consultor
        </a>
      </div>
      {inQuote && (
        <p className={s.crossSell}>
          Seu orçamento tem {total} {total === 1 ? "peça" : "peças"}. <Link href="/orcamento">Revisar e enviar</Link>
        </p>
      )}

      <dl className={s.facts}>
        <div>
          <dt>Tecido</dt>
          <dd>{product.fabric}</dd>
        </div>
        <div>
          <dt>Personalização</dt>
          <dd>{product.techniques.join(", ")}</dd>
        </div>
        <div>
          <dt>Como funciona</dt>
          <dd>Você envia a lista, um consultor retorna com preço, prazo e layout para aprovação.</dd>
        </div>
      </dl>

      <StickyBar watch={actionsRef}>
        <div className={s.stickyInfo}>
          <small>Orçamento</small>
          <strong>{qty} peças</strong>
        </div>
        <button type="button" className="btn btn-primary" onClick={addToQuote}>
          <ClipboardList size={17} /> Adicionar
        </button>
      </StickyBar>
    </div>
  );
}
