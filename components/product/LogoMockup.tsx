"use client";
import { useRef, type CSSProperties, type PointerEvent } from "react";
import type { Position, Product } from "@/lib/catalog";
import { clampPlacement, logoSpots, placedSpot, type Placement, type Placements, type View } from "@/lib/mockup";
import { SafeImage } from "@/components/ui/primitives";
import s from "./LogoMockup.module.css";

/**
 * Foto real da peça com a logo do cliente em cada posição escolhida (cada posição
 * pode ter uma logo diferente). Posição sem logo fica marcada com contorno tracejado.
 * Com `onPlace`, o cliente arrasta a logo para onde quiser na peça.
 * Preenche o contêiner (posicionado) como object-fit: cover.
 */
export function LogoMockup({
  product,
  view,
  positions,
  logos = {},
  placements = {},
  onPlace,
  priority,
  alt,
  markers = true,
}: {
  product: Pick<Product, "name" | "image" | "back" | "side" | "category"> & { slug?: string };
  view: View;
  positions: Position[];
  /** miniatura da logo de cada posição */
  logos?: Partial<Record<Position, string | null | undefined>>;
  /** posição/tamanho ajustados pelo cliente */
  placements?: Placements;
  /** liga o arrastar: recebe a nova posição da logo */
  onPlace?: (position: Position, placement: Placement) => void;
  priority?: boolean;
  alt?: string;
  /** mostra as áreas de aplicação quando ainda não há logo */
  markers?: boolean;
}) {
  const square = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pos: Position; dx: number; dy: number; s: number } | null>(null);
  const spots = logoSpots(product);
  const visible = positions.flatMap((pos) => {
    const spot = spots[pos];
    return spot && spot.view === view ? [{ pos, spot: placedSpot(spot, placements[pos]) }] : [];
  });

  const point = (e: PointerEvent) => {
    const r = square.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  const start = (pos: Position, spot: { x: number; y: number }, e: PointerEvent<HTMLSpanElement>) => {
    if (!onPlace || !square.current) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = point(e);
    // guarda onde o dedo pegou a logo, para ela não "pular" para o centro do cursor
    drag.current = { pos, dx: spot.x - p.x, dy: spot.y - p.y, s: placements[pos]?.s ?? 1 };
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || !onPlace) return;
    const p = point(e);
    onPlace(d.pos, clampPlacement({ x: p.x + d.dx, y: p.y + d.dy, s: d.s }));
  };
  const end = () => (drag.current = null);

  return (
    <div className={s.mock}>
      <div className={s.square} ref={square}>
        <SafeImage
          src={view === "back" ? product.back : view === "side" ? product.side : product.image}
          alt={alt ?? `${product.name}, ${view === "back" ? "costas" : view === "side" ? "lado" : "frente"}`}
          priority={priority}
        />
        {visible.map(({ pos, spot }) => {
          const logo = logos[pos];
          const editable = !!onPlace && !!logo;
          return logo || markers ? (
            <span
              key={pos}
              className={s.spot}
              data-empty={!logo || undefined}
              data-editable={editable || undefined}
              title={editable ? "Arraste para posicionar a logo" : undefined}
              onPointerDown={editable ? (e) => start(pos, spot, e) : undefined}
              onPointerMove={editable ? move : undefined}
              onPointerUp={editable ? end : undefined}
              onPointerCancel={editable ? end : undefined}
              onTouchStart={editable ? (e) => e.stopPropagation() : undefined}
              onTouchEnd={editable ? (e) => e.stopPropagation() : undefined}
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
              {logo ? <img src={logo} alt="" draggable={false} /> : <small>Logo</small>}
            </span>
          ) : null;
        })}
      </div>
    </div>
  );
}
