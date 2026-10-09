"use client";
import Link from "next/link";
import { ArrowRight, ChevronRight, Heart } from "lucide-react";
import { getProduct, type Product } from "@/lib/catalog";
import { useStore } from "@/components/store/StoreProvider";
import { ProductCard } from "@/components/ui/ProductCard";
import { CategoryIcon } from "@/components/ui/primitives";
import { categories } from "./filters";
import s from "./Catalog.module.css";

export default function Favorites() {
  const { favorites, ready } = useStore();
  const items = favorites.map((slug) => getProduct(slug)).filter((p): p is Product => !!p);

  return (
    <div className={`container ${s.page}`}>
      <header className={s.favHead}>
        <nav aria-label="Trilha de navegação" className={s.crumbs}>
          <Link href="/">Início</Link>
          <ChevronRight size={13} aria-hidden />
          <span aria-current="page">Favoritos</span>
        </nav>
        <div className={s.favHeadRow}>
          <div>
            <h1>Meus favoritos</h1>
            <p>
              {ready && items.length
                ? `${items.length} ${items.length === 1 ? "modelo salvo" : "modelos salvos"} para comparar e decidir com calma.`
                : "Salve modelos para comparar e montar o uniforme ideal da sua equipe."}
            </p>
          </div>
        </div>
      </header>

      {!ready ? (
        <div className={s.favGrid} aria-busy="true" aria-label="Carregando favoritos">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className={`skeleton ${s.favSkeleton}`} />)}
        </div>
      ) : items.length === 0 ? (
        <div className={`${s.empty} ${s.favEmpty}`}>
          <span className={s.emptyIcon}><Heart size={28} strokeWidth={1.5} className={s.favHeart} /></span>
          <h2>Sua lista ainda está vazia</h2>
          <p>Toque no coração dos produtos para salvá-los aqui. Seus favoritos ficam guardados neste navegador.</p>
          <div className={s.emptyActions}>
            <Link href="/loja" className="btn btn-accent">Explorar a loja <ArrowRight size={16} /></Link>
            <Link href="/sob-medida" className="btn btn-outline">Criar sob medida</Link>
          </div>
          <div className={s.emptyCats}>
            {categories.map((c) => (
              <Link key={c.slug} href={`/loja?categoria=${c.slug}`} className={s.emptyCat}>
                <CategoryIcon name={c.icon} size={18} /> {c.name}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className={s.favGrid}>
          {items.map((p, i) => (
            <div key={p.slug} className={s.gridItem} style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
