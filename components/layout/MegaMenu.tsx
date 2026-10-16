"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Package, ClipboardList } from "lucide-react";
import { categories, getProduct, money, products, stockProducts } from "@/lib/catalog";
import { CategoryIcon, SafeImage } from "@/components/ui/primitives";
import s from "./MegaMenu.module.css";

const featured = getProduct("polo-pv-basica") ?? stockProducts[0];
const countBy = (slug: string) => products.filter((p) => p.category === slug).length;

/** Painel do mega menu "Produtos": categorias com prévia em imagem, modos de compra, destaque e banner. */
export function MegaMenu({ id, open, onNavigate }: { id: string; open: boolean; onNavigate: () => void }) {
  const [active, setActive] = useState(categories[0].slug);
  const current = categories.find((c) => c.slug === active) ?? categories[0];

  return (
    <div id={id} className={s.mega} data-open={open || undefined} aria-hidden={!open} inert={!open}>
      <div className={s.inner}>
        {/* categorias */}
        <div className={s.cats}>
          <span className={s.label}>Categorias</span>
          <ul>
            {categories.map((c, i) => (
              <li key={c.slug} style={{ "--d": `${i * 30}ms` } as React.CSSProperties}>
                <Link
                  href={`/loja?categoria=${c.slug}`}
                  onClick={onNavigate}
                  className={s.cat}
                  data-active={active === c.slug || undefined}
                  onPointerEnter={() => setActive(c.slug)}
                  onFocus={() => setActive(c.slug)}
                >
                  <span className={s.catIcon}><CategoryIcon name={c.icon} size={19} /></span>
                  <b>{c.name}</b>
                  <ArrowRight size={15} className={s.catArrow} />
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/loja" onClick={onNavigate} className={s.all}>
            Ver todos os produtos <ArrowRight size={15} />
          </Link>
        </div>

        {/* prévia da categoria (crossfade) */}
        <Link href={`/loja?categoria=${current.slug}`} onClick={onNavigate} className={s.preview} aria-label={`Ver ${current.name}`}>
          {categories.map((c) => (
            <span key={c.slug} className={s.previewImg} data-active={c.slug === active || undefined} aria-hidden>
              <SafeImage src={c.image} alt="" />
            </span>
          ))}
          <span className={s.previewShade} aria-hidden />
          <span className={s.previewBody} key={current.slug}>
            <span className={s.previewCount}>
              {countBy(current.slug)} {countBy(current.slug) === 1 ? "modelo" : "modelos"}
            </span>
            <b>{current.name}</b>
            <small>{current.description}</small>
            <span className={s.previewCta}>
              Explorar categoria <ArrowRight size={15} />
            </span>
          </span>
        </Link>

        {/* modos + destaque */}
        <div className={s.modes}>
          <span className={s.label}>Como você quer comprar?</span>
          <Link href="/loja?tipo=stock" onClick={onNavigate} className={s.mode} data-tone="stock">
            <span className={s.modeIcon}><Package size={21} strokeWidth={1.75} /></span>
            <span>
              <em>Pronta-entrega</em>
              <b>Pronta para personalizar</b>
              <small>Modelo, cor e grade a partir de 5 peças com a sua logo.</small>
            </span>
            <ArrowRight className={s.modeArrow} size={18} />
          </Link>
          <Link href="/orcamento" onClick={onNavigate} className={s.mode} data-tone="custom">
            <span className={s.modeIcon}><ClipboardList size={21} strokeWidth={1.75} /></span>
            <span>
              <em>Para empresas</em>
              <b>Monte seu pedido</b>
              <small>Vários modelos, cores e quantidades em um orçamento, a partir de 30 peças.</small>
            </span>
            <ArrowRight className={s.modeArrow} size={18} />
          </Link>
          {featured && (
            <Link href={`/produto/${featured.slug}`} onClick={onNavigate} className={s.feature}>
              <span className={s.featureMedia}>
                <SafeImage src={featured.photos[0]} alt={featured.name} />
              </span>
              <span className={s.featureBody}>
                <small>{featured.badge ?? "Destaque"}</small>
                <b>{featured.name}</b>
                <span>
                  a partir de <strong>{money(featured.price)}</strong>/un.
                </span>
              </span>
              <ArrowRight className={s.modeArrow} size={18} />
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}
