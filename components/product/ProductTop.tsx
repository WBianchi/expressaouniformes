"use client";
import { useEffect, useState } from "react";
import { inStock, money, type Position, type Product, type Technique } from "@/lib/catalog";
import { PIX_DISCOUNT } from "@/lib/pricing";
import { toCatalogTechnique, type ArtTechnique } from "@/lib/qualify";
import { availablePositions, type Placement, type Placements } from "@/lib/mockup";
import { Price } from "@/components/ui/primitives";
import { ProductHead } from "./ProductHead";
import { QuoteBuyBox } from "./QuoteBuyBox";
import { StockBuyBox } from "./StockBuyBox";
import { Studio } from "./Studio";
import { useBrandLogos } from "./useBrandLogo";
import s from "./Product.module.css";
import st from "./Studio.module.css";

/** O que o estúdio do simulador escolhe e a compra usa. */
export type CustomProps = {
  color: string;
  positions: Position[];
  logos: ReturnType<typeof useBrandLogos>[0];
  placements: Placements;
  technique: Technique | null;
};

/**
 * Simulador: título e preço, o estúdio (cor, vistas da peça com a logo e técnica) e, embaixo,
 * tamanhos e compra. O estúdio e a compra compartilham cor, logos, posições e técnica.
 */
export function ProductTop({ product }: { product: Product }) {
  const [logos, setLogo] = useBrandLogos();
  const [positions, setPositions] = useState<Position[]>(() => availablePositions(product).slice(0, 1));
  // posição/tamanho que o cliente ajustou em cada lugar (sem ajuste = posição padrão)
  const [placements, setPlacements] = useState<Placements>({});
  // a técnica define o preço da personalização: começa na primeira do anúncio
  const [technique, setTechnique] = useState<Technique | null>(product.techniques[0] ?? null);
  const [color, setColor] = useState(product.colors[0]);
  const available = inStock(product);

  // vindo da página do produto (?cor=mescla) ou do questionário (?tecnica=bordado),
  // já abre na cor escolhida e com a técnica marcada
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const c = q.get("cor");
    if (c && product.colors.includes(c)) setColor(c);
    const t = toCatalogTechnique(q.get("tecnica") as ArtTechnique | null);
    if (t && product.techniques.includes(t)) setTechnique(t);
  }, [product.colors, product.techniques]);

  const onLogo: typeof setLogo = (position, next) => {
    // logo nova (ou trocada) começa na posição padrão (centro; nas costas, no alto), num tamanho que cabe
    if (next?.thumb !== logos[position]?.thumb)
      setPlacements((cur) => {
        const rest = { ...cur };
        delete rest[position];
        return rest;
      });
    setLogo(position, next);
  };

  const onPlace = (position: Position, placement: Placement | null) =>
    setPlacements((cur) => {
      const next = { ...cur };
      if (placement) next[position] = placement;
      else delete next[position];
      return next;
    });

  const custom: CustomProps = { color, positions, logos, placements, technique };
  return (
    <div className={st.sim}>
      <div className={st.simHead}>
        <ProductHead product={product} />
        {available && (
          <div className={s.priceBlock}>
            <Price value={product.price} compareAt={product.compareAt} prefix="Peça lisa a partir de" size="lg" />
            <span className={s.muted}>
              ou {money(product.price * (1 - PIX_DISCOUNT))} no Pix · pedido mínimo de {product.minQty} peças
            </span>
          </div>
        )}
      </div>
      <Studio
        product={product}
        fees={available}
        color={color}
        onColor={setColor}
        positions={positions}
        onPositions={setPositions}
        logos={logos}
        onLogo={onLogo}
        placements={placements}
        onPlace={onPlace}
        technique={technique}
        onTechnique={setTechnique}
      />
      {available ? <StockBuyBox product={product} {...custom} step={positions.length ? 4 : 3} /> : <QuoteBuyBox product={product} {...custom} step={positions.length ? 4 : 3} />}
    </div>
  );
}
