"use client";
import { Fragment, useRef, type CSSProperties, type PointerEvent } from "react";
import type { Position, Product, Technique } from "@/lib/catalog";
import { clampPlacement, logoBox, logoSpots, type Placement, type Placements, type View } from "@/lib/mockup";
import { SafeImage } from "@/components/ui/primitives";
import { useRecolored } from "@/lib/recolor";
import s from "./LogoMockup.module.css";
import { useProductMedia } from "@/components/store/MediaProvider";
import { useLogoAspects } from "./useLogoAspect";

/**
 * Foto real da peça com a logo do cliente em cada posição escolhida (cada posição
 * pode ter uma logo diferente), na proporção da imagem e no tamanho escolhido em cm.
 * Posição sem logo mostra a área de aplicação tracejada.
 * Com `onPlace`, o cliente arrasta a logo, sempre dentro da área da posição.
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
  tint,
  technique,
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
  /** cor escolhida (hex) para pintar a peça; nula = cor original da foto */
  tint?: string | null;
  /** técnica de aplicação: limita o tamanho da logo (ex.: bordado nas costas) */
  technique?: Technique | null;
}) {
  const square = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pos: Position; dx: number; dy: number; w: number; aspect: number } | null>(null);
  const spots = logoSpots(product, technique);
  const aspectOf = useLogoAspects(positions.map((p) => logos[p]));
  const visible = positions.flatMap((pos) => {
    const spot = spots[pos];
    if (!spot || spot.view !== view) return [];
    const aspect = aspectOf(logos[pos]);
    return [{ pos, spot, aspect, box: logoBox(spot, placements[pos], aspect) }];
  });

  const point = (e: PointerEvent) => {
    const r = square.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  const start = (pos: Position, box: { x: number; y: number; w: number }, aspect: number, e: PointerEvent<HTMLSpanElement>) => {
    if (!onPlace || !square.current) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = point(e);
    // guarda onde o dedo pegou a logo, para ela não "pular" para o centro do cursor
    drag.current = { pos, dx: box.x - p.x, dy: box.y - p.y, w: box.w, aspect };
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    const spot = d && spots[d.pos];
    if (!d || !spot || !onPlace) return;
    const p = point(e);
    // a logo inteira fica dentro da área da posição (ex.: a da manga não sai da manga)
    onPlace(d.pos, clampPlacement({ x: p.x + d.dx, y: p.y + d.dy, w: d.w }, spot, d.aspect));
  };
  const end = () => (drag.current = null);
  // fotos da peça trocadas no painel valem aqui (a troca de cor gera a máscara na hora)
  const piece = useProductMedia()(product);
  const src = useRecolored(view === "back" ? piece.back : view === "side" ? piece.side : piece.image, tint);

  return (
    <div className={s.mock}>
      <div className={s.square} ref={square}>
        <SafeImage
          src={src}
          alt={alt ?? `${product.name}, ${view === "back" ? "costas" : view === "side" ? "lado" : "frente"}`}
          priority={priority}
        />
        {visible.map(({ pos, spot, aspect, box }) => {
          const logo = logos[pos];
          const editable = !!onPlace && !!logo;
          const { x0, x1, y0, y1 } = spot.area;
          const areaStyle = { left: `${x0}%`, top: `${y0}%`, width: `${x1 - x0}%`, height: `${y1 - y0}%` } as CSSProperties;
          if (!logo)
            return markers ? (
              <span key={pos} className={s.area} data-empty style={areaStyle}>
                <small>Logo</small>
              </span>
            ) : null;
          return (
            <Fragment key={pos}>
              {/* área onde a logo pode ficar: aparece no simulador */}
              {editable && <span className={s.area} style={areaStyle} aria-hidden />}
              <span
                className={s.spot}
                data-editable={editable || undefined}
                title={editable ? "Arraste para posicionar a logo dentro da área" : undefined}
                onPointerDown={editable ? (e) => start(pos, box, aspect, e) : undefined}
                onPointerMove={editable ? move : undefined}
                onPointerUp={editable ? end : undefined}
                onPointerCancel={editable ? end : undefined}
                onTouchStart={editable ? (e) => e.stopPropagation() : undefined}
                onTouchEnd={editable ? (e) => e.stopPropagation() : undefined}
                style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.wPct}%`, height: `${box.hPct}%` } as CSSProperties}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt="" draggable={false} />
              </span>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
