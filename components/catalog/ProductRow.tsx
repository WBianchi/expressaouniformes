"use client";
import Link from "next/link";
import { ArrowRight, Check, Heart } from "lucide-react";
import { getCategory, inStock, type Product } from "@/lib/catalog";
import { useStore } from "@/components/store/StoreProvider";
import { Price, SafeImage, Swatches } from "@/components/ui/primitives";
import s from "./Catalog.module.css";

/** Versão em lista do card de produto (modo de exibição "lista"). */
export function ProductRow({ product }: { product: Product }) {
  const { isFavorite, toggleFavorite } = useStore();
  const fav = isFavorite(product.slug);
  const stock = inStock(product);
  const href = `/produto/${product.slug}`;
  return (
    <article className={s.row} data-kind={product.kind}>
      <Link href={href} className={s.rowMedia} aria-label={product.name}>
        <SafeImage src={product.image} alt={product.name} />
      </Link>
      <div className={s.rowBody}>
        <div className={s.rowTop}>
          <span className={stock ? "chip chip-success" : "chip"}>{stock ? "Pronta-entrega" : product.kind === "custom" ? "Sob encomenda" : "Sem estoque"}</span>
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
        </div>
      </div>
      <div className={s.rowAside}>
        {stock ? (
          <Price value={product.price} compareAt={product.compareAt} prefix="A partir de" />
        ) : (
          <div>
            <small className={s.rowMin}>Por orçamento</small>
            <strong className={s.rowMinValue}>mín. 30 peças</strong>
          </div>
        )}
        <div className={s.rowActions}>
          <Link href={href} className="btn btn-primary btn-sm">
            {stock ? "Personalizar" : "Ver e orçar"} <ArrowRight size={15} />
          </Link>
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
