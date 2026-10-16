"use client";
import { Heart, Share2 } from "lucide-react";
import { toast } from "sonner";
import { getCategory, type Product } from "@/lib/catalog";
import { useStore } from "@/components/store/StoreProvider";
import s from "./Product.module.css";

/** Título e ações (favoritar/compartilhar) comuns às duas modalidades. */
export function ProductHead({ product }: { product: Product }) {
  const { isFavorite, toggleFavorite } = useStore();
  const fav = isFavorite(product.slug);
  const cat = getCategory(product.category);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: product.short, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      /* compartilhamento cancelado */
    }
  }

  return (
    <div className={s.head}>
      <div className={s.headTop}>
        <span className={s.eyebrow}>{cat?.name}</span>
        <div className={s.headActions}>
          <button
            type="button"
            className={s.roundBtn}
            data-active={fav || undefined}
            aria-pressed={fav}
            aria-label={fav ? "Remover dos favoritos" : "Salvar nos favoritos"}
            onClick={() => toggleFavorite(product.slug)}
          >
            <Heart size={18} fill={fav ? "currentColor" : "none"} />
          </button>
          <button type="button" className={s.roundBtn} aria-label="Compartilhar" onClick={share}>
            <Share2 size={17} />
          </button>
        </div>
      </div>
      <h1 className={s.title}>{product.name}</h1>
      <div className={s.headMeta}>
        <span>{product.fabric}</span>
      </div>
      <p className={s.short}>{product.short}</p>
    </div>
  );
}
