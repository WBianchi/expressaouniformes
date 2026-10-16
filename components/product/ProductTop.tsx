"use client";
import { useState } from "react";
import { inStock, type Position, type Product } from "@/lib/catalog";
import { availablePositions, logoSpots, type View } from "@/lib/mockup";
import { Gallery } from "./Gallery";
import { QuoteBuyBox } from "./QuoteBuyBox";
import { StockBuyBox } from "./StockBuyBox";
import { useBrandLogo } from "./useBrandLogo";
import s from "./Product.module.css";

/**
 * Galeria + caixa de compra. As duas compartilham a logo e as posições: o que o
 * cliente escolhe aparece na foto da peça, igual na compra online e no orçamento.
 */
export function ProductTop({ product }: { product: Product }) {
  const [logo, setLogo] = useBrandLogo();
  const [positions, setPositionsState] = useState<Position[]>(() => availablePositions(product).slice(0, 1));
  const [view, setView] = useState<View>("front");

  // ao marcar uma posição, a galeria vira para o lado onde ela fica
  const setPositions = (next: Position[]) => {
    const added = next.find((p) => !positions.includes(p));
    const spot = added && logoSpots(product)[added];
    if (spot) setView(spot.view);
    setPositionsState(next);
  };

  const custom = { positions, onPositions: setPositions, logo, onLogo: setLogo };
  return (
    <div className={s.top}>
      <Gallery product={product} positions={positions} logo={logo?.thumb} view={view} onViewChange={setView} />
      {inStock(product) ? <StockBuyBox product={product} {...custom} /> : <QuoteBuyBox product={product} {...custom} />}
    </div>
  );
}
