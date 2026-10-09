"use client";
import Link from "next/link";
import { ArrowRight, Check, Heart, MessageCircle, Package, Sparkles } from "lucide-react";
import { getCategory, whatsappLink, type Product } from "@/lib/catalog";
import { useStore } from "@/components/store/StoreProvider";
import { Price, Rating, SafeImage, Swatches } from "@/components/ui/primitives";
import s from "./Catalog.module.css";

/** Versão em lista do card de produto (modo de exibição "lista"). */
export function ProductRow({ product }: { product: Product }) {
  const { isFavorite, toggleFavorite } = useStore();
  const fav = isFavorite(product.slug);
  const stock = product.kind === "stock";
  const href = `/produto/${product.slug}`;
  return (
    <article className={s.row} data-kind={product.kind}>
      <Link href={href} className={s.rowMedia} aria-label={product.name}>
        <SafeImage src={product.image} alt={product.name} />
      </Link>
      <div className={s.rowBody}>
        <div className={s.rowTop}>
          {stock ? (
            <span className="chip chip-success"><Package size={12} /> Em estoque</span>
          ) : (
            <span className="chip chip-brand"><Sparkles size={12} /> Sob medida</span>
          )}
          {product.badge && <span className="chip chip-gold">{product.badge}</span>}
          <span className={s.rowCat}>{getCategory(product.category)?.name}</span>
        </div>
        <Link href={href} className={s.rowTitle}>{product.name}</Link>
        <p className={s.rowShort}>{product.short}</p>
        <ul className={s.rowFeatures}>
          {product.features.slice(0, 3).map((f) => (
            <li key={f}><Check size={13} strokeWidth={2.5} /> {f}</li>
          ))}
        </ul>
        <div className={s.rowMeta}>
          <Swatches ids={product.colors} size="sm" max={8} />
          <Rating value={product.rating} reviews={product.reviews} />
        </div>
      </div>
      <div className={s.rowAside}>
        {stock ? (
          <Price value={product.price} compareAt={product.compareAt} prefix="A partir de" />
        ) : (
          <div>
            <small className={s.rowMin}>Pedido mínimo</small>
            <strong className={s.rowMinValue}>{product.minQty} peças</strong>
          </div>
        )}
        <div className={s.rowActions}>
          {stock ? (
            <Link href={href} className="btn btn-accent btn-sm">Personalizar <ArrowRight size={15} /></Link>
          ) : (
            <>
              <Link href={`/sob-medida?modelo=${product.slug}`} className="btn btn-primary btn-sm">Desenvolver <ArrowRight size={15} /></Link>
              <a
                className="btn btn-outline btn-sm"
                href={whatsappLink(`Olá! Quero um orçamento do modelo ${product.name} (mínimo ${product.minQty} peças).`)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Falar com consultor sobre ${product.name}`}
              >
                <MessageCircle size={15} />
              </a>
            </>
          )}
          <button
            type="button"
            className={s.rowFav}
            data-active={fav || undefined}
            aria-pressed={fav}
            aria-label={fav ? "Remover dos favoritos" : "Salvar nos favoritos"}
            onClick={() => toggleFavorite(product.slug)}
          >
            <Heart size={17} fill={fav ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </article>
  );
}
