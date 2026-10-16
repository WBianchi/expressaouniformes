"use client";
import { useState } from "react";
import { inStock, type Position, type Product } from "@/lib/catalog";
import { availablePositions, logoSpots } from "@/lib/mockup";
import { Gallery, type Slide } from "./Gallery";
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
  const [view, setView] = useState<Slide>("photo-0");

  // ao marcar uma posição, a galeria vira para o lado onde ela fica
  const setPositions = (next: Position[]) => {
    const added = next.find((p) => !positions.includes(p));
    const spot = added && logoSpots(product)[added];
    if (spot) setView(spot.view);
    setPositionsState(next);
  };

  // ao enviar a logo, sai da foto com modelo e mostra a peça com a logo aplicada
  const onLogo: typeof setLogo = (next) => {
    const spot = next && positions[0] && logoSpots(product)[positions[0]];
    if (spot) setView(spot.view);
    setLogo(next);
  };

  const custom = { positions, onPositions: setPositions, logo, onLogo };
  return (
    <div className={s.top}>
      <Gallery product={product} positions={positions} logo={logo?.thumb} view={view} onViewChange={setView} />
      {inStock(product) ? <StockBuyBox product={product} {...custom} /> : <QuoteBuyBox product={product} {...custom} />}
    </div>
  );
}
