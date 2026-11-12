"use client";
import { useEffect, useState } from "react";
import { inStock, type Position, type Product, type Technique } from "@/lib/catalog";
import { toCatalogTechnique, type ArtTechnique } from "@/lib/qualify";
import { availablePositions, logoSpots, type Placement, type Placements } from "@/lib/mockup";
import { Gallery, type Slide } from "./Gallery";

export type ColorProps = { color: string; onColor: (id: string) => void };
import { QuoteBuyBox } from "./QuoteBuyBox";
import { StockBuyBox } from "./StockBuyBox";
import { logoThumbs, useBrandLogos } from "./useBrandLogo";
import s from "./Product.module.css";

/**
 * Galeria + caixa de compra. As duas compartilham a logo e as posições: o que o
 * cliente escolhe aparece na foto da peça, igual na compra online e no orçamento.
 */
export function ProductTop({ product }: { product: Product }) {
  const [logos, setLogo] = useBrandLogos();
  const [positions, setPositionsState] = useState<Position[]>(() => availablePositions(product).slice(0, 1));
  const [view, setView] = useState<Slide>("front");
  // posição/tamanho que o cliente ajustou em cada lugar (sem ajuste = posição padrão)
  const [placements, setPlacements] = useState<Placements>({});
  const [technique, setTechnique] = useState<Technique | null>(null);
  const [color, setColorState] = useState(product.colors[0]);
  // ao trocar a cor, mostra a peça (a foto da pessoa vestindo não muda de cor)
  const setColor = (id: string) => {
    setColorState(id);
    setView((v) => (v === "front" || v === "back" || v === "side" ? v : "front"));
  };

  // vindo do questionário (?tecnica=bordado), já deixa a técnica marcada
  useEffect(() => {
    const t = toCatalogTechnique(new URLSearchParams(window.location.search).get("tecnica") as ArtTechnique | null);
    if (t && product.techniques.includes(t)) setTechnique(t);
  }, [product.techniques]);

  // ao marcar uma posição, a galeria vira para o lado onde ela fica
  const setPositions = (next: Position[]) => {
    const added = next.find((p) => !positions.includes(p));
    const spot = added && logoSpots(product)[added];
    if (spot) setView(spot.view);
    setPositionsState(next);
  };

  // ao enviar a logo de uma posição, a galeria mostra o lado onde ela fica
  const onLogo: typeof setLogo = (position, next) => {
    const spot = next && logoSpots(product)[position];
    if (spot) setView(spot.view);
    setLogo(position, next);
  };

  const onPlace = (position: Position, placement: Placement | null) => {
    const spot = logoSpots(product)[position];
    if (spot) setView(spot.view);
    setPlacements((cur) => {
      const next = { ...cur };
      if (placement) next[position] = placement;
      else delete next[position];
      return next;
    });
  };

  const custom = { color, onColor: setColor, positions, onPositions: setPositions, logos, onLogo, placements, onPlace, technique, onTechnique: setTechnique };
  return (
    <div className={s.top}>
      <Gallery
        product={product}
        positions={positions}
        logos={logoThumbs(logos)}
        placements={placements}
        onPlace={onPlace}
        view={view}
        onViewChange={setView}
        color={color}
      />
      {inStock(product) ? <StockBuyBox product={product} {...custom} /> : <QuoteBuyBox product={product} {...custom} />}
    </div>
  );
}
