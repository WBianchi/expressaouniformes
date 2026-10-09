"use client";
import Link from "next/link";
import { useRef } from "react";
import {
  ArrowRight,
  Brush,
  CircleDot,
  ClipboardList,
  Factory,
  Headset,
  Layers,
  MessageCircle,
  Palette,
  Ruler,
  Scissors,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import { getColor, whatsappLink, type Product } from "@/lib/catalog";
import { Swatches } from "@/components/ui/primitives";
import { ProductHead } from "./ProductHead";
import { StickyBar } from "./StickyBar";
import s from "./Product.module.css";

const optionIcons: Record<string, typeof Brush> = {
  Friso: Ruler,
  Gola: Scissors,
  Punho: CircleDot,
  Botões: CircleDot,
  Recortes: Layers,
  Cores: Palette,
  Etiqueta: Tag,
  Refletivo: ShieldCheck,
  Tecido: Layers,
};
const optionText: Record<string, string> = {
  Friso: "Frisos nas cores da marca",
  Gola: "Modelo e cor da gola",
  Punho: "Punho liso ou com friso",
  Botões: "Botões personalizados",
  Recortes: "Recortes e combinações",
  Cores: "Paleta da sua identidade",
  Etiqueta: "Etiqueta com sua marca",
  Refletivo: "Faixas refletivas",
  Tecido: "Escolha do tecido ideal",
};

export function CustomBuyBox({ product }: { product: Product }) {
  const actionsRef = useRef<HTMLDivElement>(null);
  const href = `/sob-medida?modelo=${product.slug}`;
  const wa = whatsappLink(`Olá! Quero desenvolver o modelo ${product.name} (pedido mínimo de ${product.minQty} peças). Podem me ajudar?`);
  return (
    <div className={s.buy}>
      <ProductHead product={product} />

      <div className={s.customBanner}>
        <span className={s.customIcon}><Sparkles size={20} /></span>
        <div>
          <b>Produção sob medida</b>
          <p>Modelo desenvolvido com a sua identidade. O orçamento é feito por um consultor, de acordo com tecido, acabamentos e quantidade.</p>
        </div>
      </div>

      <dl className={s.customFacts}>
        <div><dt><Users size={16} /> Pedido mínimo</dt><dd>{product.minQty} peças</dd></div>
        <div><dt><Layers size={16} /> Tecidos</dt><dd>{product.fabric}</dd></div>
        <div><dt><Brush size={16} /> Técnicas</dt><dd>{product.techniques.join(", ")}</dd></div>
      </dl>

      {product.options?.length ? (
        <section className={s.step} aria-labelledby="cu-opt">
          <h2 id="cu-opt" className={s.stepTitle}>O que você personaliza</h2>
          <ul className={s.optionGrid}>
            {product.options.map((o) => {
              const I = optionIcons[o] ?? Sparkles;
              return (
                <li key={o}>
                  <span><I size={18} strokeWidth={1.75} /></span>
                  <b>{o}</b>
                  <small>{optionText[o] ?? "Acabamento sob medida"}</small>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className={s.step} aria-labelledby="cu-colors">
        <h2 id="cu-colors" className={s.stepTitle}>
          Cores de referência <span className={s.stepValue}>outras cores sob consulta</span>
        </h2>
        <Swatches ids={product.colors} size="md" />
        <p className={s.note}>{product.colors.map((c) => getColor(c)?.name).filter(Boolean).join(" · ")}</p>
      </section>

      <div className={s.actions} ref={actionsRef}>
        <Link href={href} className="btn btn-accent btn-lg btn-block">
          Desenvolver este modelo <ArrowRight size={18} />
        </Link>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg btn-block">
          <MessageCircle size={18} /> Falar no WhatsApp
        </a>
      </div>

      <section className={s.flow} aria-labelledby="cu-flow">
        <h2 id="cu-flow" className={s.shipTitle}>Como funciona a produção sob medida</h2>
        <ol className={s.flowList}>
          <li><span><ClipboardList size={17} /></span><b>Você monta o briefing</b><small>tecido, cores e quantidade</small></li>
          <li><span><Headset size={17} /></span><b>Consultor entra em contato</b><small>pelo WhatsApp</small></li>
          <li><span><Brush size={17} /></span><b>Aprovação do projeto</b><small>layout e orçamento</small></li>
          <li><span><Factory size={17} /></span><b>Produção própria</b><small>e entrega para todo o Brasil</small></li>
        </ol>
      </section>

      <StickyBar watch={actionsRef}>
        <div className={s.stickyInfo}>
          <small>Sob medida</small>
          <strong>Mín. {product.minQty} peças</strong>
        </div>
        <Link href={href} className="btn btn-accent">
          Desenvolver <ArrowRight size={16} />
        </Link>
      </StickyBar>
    </div>
  );
}
