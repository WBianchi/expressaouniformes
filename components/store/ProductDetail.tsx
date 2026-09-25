"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import {
  Sparkles,
  Heart,
  Check,
  ShieldCheck,
  ArrowRight,
  Rotate3D,
} from "lucide-react";
import { type Product, colors, newDesign, money } from "@/lib/catalog";
import { useStore } from "./StoreProvider";
import { StoreShell } from "./Chrome";
const Shirt = dynamic(() => import("@/components/studio/ShirtPreview"), {
  ssr: false,
});
export default function ProductDetail({ product }: { product: Product }) {
  const [color, setColor] = useState(product.color);
  const { openStudio, toggleFavorite, favorites } = useStore();
  return (
    <StoreShell>
      <div className="breadcrumb">
        <Link href="/">Início</Link>
        <span>/</span>
        <Link href="/loja">Uniformes</Link>
        <span>/</span>
        {product.name}
      </div>
      <section className="product-detail">
        <div className="detail-visual">
          <span className="product-badge">{product.tag}</span>
          <Shirt color={color} interactive zoom={700} />
          <span className="visual-caption">
            <Rotate3D size={16} /> Arraste para explorar a peça em 3D
          </span>
        </div>
        <div className="detail-info">
          <span className="eyebrow">
            {product.category} · COLEÇÃO EXPRESSÃO
          </span>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="detail-price">
            <small>A partir de</small>
            <strong>
              {money(product.price)} <span>/ unidade</span>
            </strong>
            <small>
              Valor ilustrativo · mínimo de 30 peças por cor e modelo
            </small>
          </div>
          <label className="field-label">
            Cor: {colors.find((c) => c.hex === color)?.name}
          </label>
          <div className="swatches">
            {colors.map((c) => (
              <button
                aria-label={c.name}
                aria-pressed={color === c.hex}
                key={c.hex}
                style={{ background: c.hex }}
                onClick={() => setColor(c.hex)}
              >
                {color === c.hex && (
                  <Check
                    size={17}
                    color={c.hex === "#e5e1d8" ? "#123" : "#fff"}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="detail-cta">
            <button
              className="button primary"
              onClick={() =>
                openStudio(product, { ...newDesign(product), color })
              }
            >
              <Sparkles size={18} /> Personalizar este uniforme{" "}
              <ArrowRight size={17} />
            </button>
            <button
              className="button secondary"
              aria-label="Favoritar produto"
              onClick={() => toggleFavorite(product.id)}
            >
              <Heart
                size={20}
                fill={favorites.includes(product.id) ? "currentColor" : "none"}
              />
            </button>
          </div>
          <div className="detail-note">
            <ShieldCheck size={20} />
            <p>
              Sua criação acompanha o pedido. Antes de produzir, a fábrica
              confere a aplicação da marca.
            </p>
          </div>
          <details open>
            <summary>Sobre a personalização</summary>
            <p>
              Envie sua logo, adicione textos e experimente cores no estúdio.
              Frente e costas possuem artes independentes. Escolha a técnica e
              distribua a quantidade entre P, M, G e GG.
            </p>
          </details>
          <details>
            <summary>Materiais e medidas</summary>
            <p>
              Este é um produto demonstrativo. Composição, gramatura, tabela de
              medidas e modelagem serão confirmadas pela fábrica antes da venda.
            </p>
          </details>
          <details>
            <summary>Produção e entrega</summary>
            <p>
              Prazo e frete serão definidos após configuração do catálogo e das
              integrações. A prévia não realiza cobranças.
            </p>
          </details>
        </div>
      </section>
    </StoreShell>
  );
}
