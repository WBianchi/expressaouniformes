"use client";
import type { CSSProperties } from "react";
import type { Position, Product } from "@/lib/catalog";
import { logoSpots, type View } from "@/lib/mockup";
import { SafeImage } from "@/components/ui/primitives";
import s from "./LogoMockup.module.css";

/**
 * Foto real da peça com a logo do cliente nas posições escolhidas.
 * Sem logo, marca as áreas de aplicação com um contorno tracejado.
 * Preenche o contêiner (posicionado) como object-fit: cover.
 */
export function LogoMockup({
  product,
  view,
  positions,
  logo,
  priority,
  alt,
  markers = true,
}: {
  product: Pick<Product, "name" | "image" | "back" | "category">;
  view: View;
  positions: Position[];
  logo?: string | null;
  priority?: boolean;
  alt?: string;
  /** mostra as áreas de aplicação quando ainda não há logo */
  markers?: boolean;
}) {
  const spots = logoSpots(product);
  const visible = positions.flatMap((pos) => {
    const spot = spots[pos];
    return spot && spot.view === view ? [{ pos, spot }] : [];
  });
  return (
    <div className={s.mock}>
      <div className={s.square}>
        <SafeImage
          src={view === "back" ? product.back : product.image}
          alt={alt ?? `${product.name}, ${view === "back" ? "costas" : "frente"}`}
          priority={priority}
        />
        {visible.map(({ pos, spot }) =>
          logo || markers ? (
            <span
              key={pos}
              className={s.spot}
              data-empty={!logo || undefined}
              style={
                {
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  width: `${spot.w}%`,
                  height: `${spot.h}%`,
                  "--rot": `${spot.rot ?? 0}deg`,
                } as CSSProperties
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {logo ? <img src={logo} alt="" /> : <small>Logo</small>}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}
