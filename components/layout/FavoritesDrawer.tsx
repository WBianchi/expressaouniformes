"use client";
import Link from "next/link";
import { ArrowRight, Heart, HeartOff, Sparkles } from "lucide-react";
import { getCategory, getProduct, money, type Product } from "@/lib/catalog";
import { useStore } from "@/components/store/StoreProvider";
import { Drawer } from "@/components/ui/Drawer";
import { SafeImage } from "@/components/ui/primitives";
import s from "./FavoritesDrawer.module.css";

/** Drawer lateral de favoritos. */
export function FavoritesDrawer() {
  const { ready, favorites, toggleFavorite, drawer, openDrawer, closeDrawer } = useStore();
  const open = drawer === "favorites";
  const items = favorites.map(getProduct).filter((p): p is Product => !!p);

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => (o ? openDrawer("favorites") : closeDrawer())}
      title="Favoritos"
      description={ready && items.length ? `${items.length} ${items.length === 1 ? "modelo salvo" : "modelos salvos"}` : "Modelos que você salvou para depois"}
      width={420}
      footer={
        ready && items.length > 0 ? (
          <Link href="/favoritos" className="btn btn-primary btn-block" onClick={closeDrawer}>
            Ver todos os favoritos <ArrowRight size={18} />
          </Link>
        ) : undefined
      }
    >
      {!ready ? (
        <div className={s.list}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={`skeleton ${s.skel}`} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className={s.empty}>
          <div className={s.emptyArt} aria-hidden>
            <Heart size={38} strokeWidth={1.4} />
          </div>
          <h3>Nenhum favorito ainda</h3>
          <p>Toque no coração dos produtos para salvar modelos e comparar com calma.</p>
          <Link href="/loja" className="btn btn-primary" onClick={closeDrawer}>
            Explorar produtos <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <ul className={s.list}>
          {items.map((p) => (
            <li key={p.slug} className={s.item}>
              <Link href={`/produto/${p.slug}`} className={s.thumb} onClick={closeDrawer} aria-label={p.name}>
                <SafeImage src={p.image} alt="" />
              </Link>
              <div className={s.info}>
                <small>{getCategory(p.category)?.name}</small>
                <Link href={`/produto/${p.slug}`} className={s.name} onClick={closeDrawer}>
                  {p.name}
                </Link>
                {p.kind === "stock" ? (
                  <span className={s.price}>
                    <b>{money(p.price)}</b>/un. · mín. {p.minQty} peças
                  </span>
                ) : (
                  <span className="chip chip-brand">
                    <Sparkles size={12} /> Sob medida
                  </span>
                )}
                <Link href={`/produto/${p.slug}`} className={s.go} onClick={closeDrawer}>
                  {p.kind === "stock" ? "Personalizar" : "Ver modelo"} <ArrowRight size={14} />
                </Link>
              </div>
              <button type="button" className={s.remove} aria-label={`Remover ${p.name} dos favoritos`} onClick={() => toggleFavorite(p.slug)}>
                <Heart className={s.on} size={18} fill="currentColor" />
                <HeartOff className={s.offIcon} size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
