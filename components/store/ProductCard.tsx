"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Heart, ArrowLeftRight, Sparkles, Plus } from "lucide-react";
import { type Product, money } from "@/lib/catalog";
import { useStore } from "./StoreProvider";
const Shirt = dynamic(() => import("@/components/studio/ShirtPreview"), {
  ssr: false,
});
export default function ProductCard({ product }: { product: Product }) {
  const { openStudio, toggleFavorite, favorites, toggleCompare, compare } =
    useStore();
  return (
    <article className="product-card">
      <div className="product-image">
        <Link
          href={"/produto/" + product.id}
          className="product-visual"
          aria-label={"Ver " + product.name}
        >
          <Shirt color={product.color} />
        </Link>
        <span className="product-badge">{product.tag}</span>
        <button
          className={
            "favorite icon-button " +
            (favorites.includes(product.id) ? "selected" : "")
          }
          aria-label={"Favoritar " + product.name}
          onClick={() => toggleFavorite(product.id)}
        >
          <Heart
            size={18}
            fill={favorites.includes(product.id) ? "currentColor" : "none"}
          />
        </button>
        <button
          className={
            "compare icon-button " +
            (compare.includes(product.id) ? "selected" : "")
          }
          aria-label={"Comparar " + product.name}
          onClick={() => toggleCompare(product.id)}
        >
          <ArrowLeftRight size={17} />
        </button>
        <div className="color-dots">
          {["#244e8a", "#eee9df", "#262b30", "#65b7b6"].map((c) => (
            <span key={c} style={{ background: c }} />
          ))}
          <small>+ cores</small>
        </div>
      </div>
      <div className="product-info">
        <span className="eyebrow muted">{product.category}</span>
        <Link href={"/produto/" + product.id}>
          <h3>{product.name}</h3>
        </Link>
        <p>
          A partir de <strong>{money(product.price)}</strong>
          <small>/un.</small>
        </p>
        <div className="product-actions">
          <button onClick={() => openStudio(product)}>
            <Sparkles size={16} /> Personalizar
          </button>
          <button
            className="add-button"
            aria-label={"Configurar e adicionar " + product.name}
            onClick={() => openStudio(product)}
          >
            <Plus size={19} />
          </button>
        </div>
      </div>
    </article>
  );
}
