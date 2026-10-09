"use client";
import { useEffect, useState } from "react";
import { getProduct, type Product } from "@/lib/catalog";
import { ProductCard } from "@/components/ui/ProductCard";
import { SectionHeader } from "@/components/ui/primitives";
import s from "./Product.module.css";

const KEY = "eu-recent";

/** Registra o produto atual e lista os vistos recentemente (armazenamento local). */
export function RecentlyViewed({ current }: { current: string }) {
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    let list: string[] = [];
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(raw)) list = raw.filter((x): x is string => typeof x === "string" && !!getProduct(x));
    } catch {
      /* armazenamento indisponível */
    }
    setItems(list.filter((x) => x !== current).slice(0, 5).map((x) => getProduct(x)!));
    try {
      localStorage.setItem(KEY, JSON.stringify([current, ...list.filter((x) => x !== current)].slice(0, 12)));
    } catch {
      /* armazenamento indisponível */
    }
  }, [current]);

  if (!items.length) return null;
  return (
    <section className={`container ${s.related}`} aria-labelledby="recent-title">
      <SectionHeader eyebrow="Seu histórico" title={<span id="recent-title">Vistos recentemente</span>} />
      <div className={s.relatedGrid}>
        {items.map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
    </section>
  );
}
