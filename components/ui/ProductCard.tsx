"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { inStock, money, type Product } from "@/lib/catalog";
import { useStore } from "@/components/store/StoreProvider";
import { SafeImage, Swatches } from "./primitives";
import s from "./ui.module.css";

/** Card de produto: pronta-entrega com preço; sem estoque ou sob encomenda, por orçamento. */
export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { isFavorite, toggleFavorite } = useStore();
  const fav = isFavorite(product.slug);
  const available = inStock(product);
  const href = `/produto/${product.slug}`;
  const status = available ? "Pronta-entrega" : product.kind === "custom" ? "Sob encomenda" : "Sem estoque";
  return (
    <article className={s.card} data-available={available || undefined}>
      <Link href={href} className={s.cardMedia} aria-label={product.name}>
        <SafeImage src={product.image} alt={product.name} priority={priority} />
        {!available && <span className={s.cardTag}>{status}</span>}
      </Link>
      <button
        type="button"
        className={s.favBtn}
        data-active={fav || undefined}
        aria-pressed={fav}
        aria-label={fav ? "Remover dos favoritos" : "Salvar nos favoritos"}
        onClick={() => toggleFavorite(product.slug)}
      >
        <Heart size={17} fill={fav ? "currentColor" : "none"} />
      </button>
      <div className={s.cardBody}>
        <Link href={href} className={s.cardTitle}>
          {product.name}
        </Link>
        {available ? (
          <p className={s.cardPrice}>
            <small>a partir de</small> <b>{money(product.price)}</b>
            {product.compareAt && <del>{money(product.compareAt)}</del>}
          </p>
        ) : (
          <p className={s.cardPrice}>
            <small>Por orçamento · mín. 30 peças</small>
          </p>
        )}
        <Swatches ids={product.colors} size="sm" max={6} />
      </div>
    </article>
  );
}
