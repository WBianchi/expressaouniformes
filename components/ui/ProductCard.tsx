"use client";
import Link from "next/link";
import { ArrowRight, Heart, MessageCircle, Package, Sparkles } from "lucide-react";
import { type Product, whatsappLink } from "@/lib/catalog";
import { useStore } from "@/components/store/StoreProvider";
import { Price, Rating, SafeImage, Swatches } from "./primitives";
import s from "./ui.module.css";

/** Card único para pronta-entrega (preço + personalizar) e sob medida (consultivo). */
export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { isFavorite, toggleFavorite } = useStore();
  const fav = isFavorite(product.slug);
  const stock = product.kind === "stock";
  const href = `/produto/${product.slug}`;
  return (
    <article className={s.card} data-kind={product.kind}>
      <Link href={href} className={s.cardMedia} aria-label={product.name}>
        <SafeImage src={product.image} alt={product.name} priority={priority} />
        <span className={s.cardBadges}>
          {stock ? (
            <span className="chip chip-success"><Package size={12} /> Em estoque</span>
          ) : (
            <span className="chip chip-brand"><Sparkles size={12} /> Sob medida</span>
          )}
          {product.badge && <span className="chip chip-gold">{product.badge}</span>}
        </span>
      </Link>
      <button
        type="button"
        className={s.favBtn}
        data-active={fav || undefined}
        aria-pressed={fav}
        aria-label={fav ? "Remover dos favoritos" : "Salvar nos favoritos"}
        onClick={() => toggleFavorite(product.slug)}
      >
        <Heart size={18} fill={fav ? "currentColor" : "none"} />
      </button>
      <div className={s.cardBody}>
        <div className={s.cardMeta}>
          <Swatches ids={product.colors} size="sm" max={6} />
          <Rating value={product.rating} reviews={product.reviews} />
        </div>
        <Link href={href} className={s.cardTitle}>{product.name}</Link>
        <p className={s.cardShort}>{product.short}</p>
        <div className={s.cardFoot}>
          {stock ? (
            <Price value={product.price} compareAt={product.compareAt} prefix="A partir de" />
          ) : (
            <div className={s.price}>
              <small className={s.pricePrefix}>Pedido mínimo</small>
              <div className={s.priceRow}><strong>{product.minQty} peças</strong></div>
            </div>
          )}
        </div>
        {stock ? (
          <Link href={href} className="btn btn-accent btn-sm btn-block">
            Personalizar agora <ArrowRight size={15} />
          </Link>
        ) : (
          <div className={s.cardActions}>
            <Link href={`/sob-medida?modelo=${product.slug}`} className="btn btn-primary btn-sm">
              Desenvolver <ArrowRight size={15} />
            </Link>
            <a
              className="btn btn-outline btn-sm"
              href={whatsappLink(`Olá! Quero um orçamento do modelo ${product.name} (mínimo ${product.minQty} peças).`)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Falar com consultor sobre ${product.name}`}
            >
              <MessageCircle size={15} />
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
