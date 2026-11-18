"use client";
import { Fragment, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import type { Position, Product, Technique } from "@/lib/catalog";
import {
  cmText,
  logoBox,
  logoSpots,
  moveWithin,
  resizeFromCorner,
  resizePlacement,
  type Corner,
  type Fits,
  type Placement,
  type Placements,
  type View,
} from "@/lib/mockup";
import { SafeImage } from "@/components/ui/primitives";
import { useRecolored } from "@/lib/recolor";
import s from "./LogoMockup.module.css";
import { useProductMedia } from "@/components/store/MediaProvider";
import { useLogoAspects } from "./useLogoAspect";

type MockProduct = Pick<Product, "name" | "image" | "back" | "side" | "category"> & { slug?: string; colorPhotos?: Record<string, string[]> };

/** Posição de cada vista nas fotos por cor do painel: 0–1 vestindo, 2–4 peça (frente, costas, lado). */
const VIEW_SLOT: Record<View, number> = { front: 2, back: 3, side: 4 };

/**
 * Foto da peça numa vista: a foto própria da cor (painel → Fotos por cor), quando houver, como
 * está; senão a foto da peça (com as trocas do painel), que a troca de cor pinta na cor `tint`.
 */
export function usePiecePhoto(product: MockProduct, view: View, color?: string | null, tint?: string | null) {
  const piece = useProductMedia()(product);
  const own = color ? product.colorPhotos?.[color]?.[VIEW_SLOT[view]] : undefined;
  const base = own || (view === "back" ? piece.back : view === "side" ? piece.side : piece.image);
  return { base, tint: own ? null : (tint ?? null) };
}

const CORNERS: Corner[] = ["nw", "ne", "sw", "se"];

type Drag = { pos: Position; mode: "move" | Corner; dx: number; dy: number; from: Placement; aspect: number };

/**
 * Foto real da peça com a logo do cliente em cada posição escolhida (cada posição
 * pode ter uma logo diferente), na proporção da imagem e no tamanho escolhido em cm.
 * Posição sem logo mostra a área padrão tracejada.
 * Com `onPlace` (simulador), o cliente arrasta a logo para qualquer lugar da peça nesta vista
 * (`fits` não deixa sair do contorno da peça) e puxa os cantos para aumentar ou diminuir.
 * Preenche o contêiner (posicionado) como object-fit: cover.
 */
export function LogoMockup({
  product,
  view,
  positions,
  logos = {},
  placements = {},
  onPlace,
  fits,
  priority,
  alt,
  markers = true,
  tint,
  color,
  technique,
}: {
  product: MockProduct;
  view: View;
  positions: Position[];
  /** miniatura da logo de cada posição */
  logos?: Partial<Record<Position, string | null | undefined>>;
  /** posição/tamanho ajustados pelo cliente */
  placements?: Placements;
  /** liga o simulador: arrastar e redimensionar a logo */
  onPlace?: (position: Position, placement: Placement) => void;
  /** contorno da peça nesta foto (a logo não sai dele) */
  fits?: Fits;
  priority?: boolean;
  alt?: string;
  /** mostra as áreas padrão quando ainda não há logo */
  markers?: boolean;
  /** cor escolhida (hex) para pintar a peça; nula = cor original da foto */
  tint?: string | null;
  /** cor escolhida (id): usa a foto própria da cor, se o painel tiver */
  color?: string | null;
  /** técnica de aplicação: limita o tamanho da logo (ex.: bordado nas costas) */
  technique?: Technique | null;
}) {
  const square = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  // tocar fora da logo esconde a moldura (para ver a prévia limpa); tocar na logo mostra de novo
  const [bare, setBare] = useState(false);
  const [dragging, setDragging] = useState(false);
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

  const start = (pos: Position, mode: Drag["mode"], box: Placement, aspect: number, e: PointerEvent<HTMLElement>) => {
    if (!onPlace || !square.current) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = point(e);
    // guarda onde o dedo pegou a logo, para ela não "pular" para o centro do cursor
    drag.current = { pos, mode, dx: box.x - p.x, dy: box.y - p.y, from: { x: box.x, y: box.y, w: box.w }, aspect };
    setBare(false);
    setDragging(true);
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    const spot = d && spots[d.pos];
    if (!d || !spot || !onPlace) return;
    const p = point(e);
    const next =
      d.mode === "move"
        ? moveWithin(d.from, { x: p.x + d.dx, y: p.y + d.dy }, spot, d.aspect, fits)
        : resizeFromCorner(d.from, d.mode, p, spot, d.aspect, fits);
    // arrastar segue a partir do último ponto que coube (desliza pela borda da peça)
    if (d.mode === "move") d.from = next;
    onPlace(d.pos, next);
  };
  const end = () => {
    drag.current = null;
    setDragging(false);
  };

  // teclado: setas movem, + e − mudam o tamanho
  const key = (pos: Position, box: Placement, aspect: number, e: KeyboardEvent) => {
    const spot = spots[pos];
    if (!spot || !onPlace) return;
    const step = e.shiftKey ? 3 : 0.5;
    const dir: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (dir[e.key]) {
      e.preventDefault();
      onPlace(pos, moveWithin(box, { x: box.x + dir[e.key][0], y: box.y + dir[e.key][1] }, spot, aspect, fits));
    } else if (e.key === "+" || e.key === "=" || e.key === "-") {
      e.preventDefault();
      onPlace(pos, resizePlacement(box, box.w + (e.key === "-" ? -0.5 : 0.5), spot, aspect, fits));
    }
  };

  const photo = usePiecePhoto(product, view, color, tint);
  const src = useRecolored(photo.base, photo.tint);
  const label = view === "back" ? "costas" : view === "side" ? "lado" : "frente";

  return (
    <div className={s.mock}>
      <div
        className={s.square}
        ref={square}
        data-dragging={dragging || undefined}
        onPointerDown={onPlace ? () => setBare(true) : undefined}
        onPointerMove={onPlace ? move : undefined}
        onPointerUp={onPlace ? end : undefined}
        onPointerCancel={onPlace ? end : undefined}
      >
        <SafeImage src={src} alt={alt ?? `${product.name}, ${label}`} priority={priority} />
        {visible.map(({ pos, spot, aspect, box }) => {
          const logo = logos[pos];
          const editable = !!onPlace && !!logo;
          if (!logo) {
            const { x0, x1, y0, y1 } = spot.area;
            return markers ? (
              <span key={pos} className={s.area} data-empty style={{ left: `${x0}%`, top: `${y0}%`, width: `${x1 - x0}%`, height: `${y1 - y0}%` }}>
                <small>Sua logo</small>
              </span>
            ) : null;
          }
          return (
            <Fragment key={pos}>
              <span
                className={s.spot}
                data-editable={editable || undefined}
                data-active={(editable && !bare) || undefined}
                data-low={box.y + box.hPct / 2 > 88 || undefined}
                role={editable ? "group" : undefined}
                tabIndex={editable ? 0 : undefined}
                aria-label={editable ? `Logo da ${label}: ${cmText(box.w)} por ${cmText(box.hCm)} cm. Arraste para mover, puxe os cantos para mudar o tamanho; no teclado, setas movem e + ou − mudam o tamanho.` : undefined}
                onPointerDown={editable ? (e) => start(pos, "move", box, aspect, e) : undefined}
                onKeyDown={editable ? (e) => key(pos, box, aspect, e) : undefined}
                onFocus={editable ? () => setBare(false) : undefined}
                onTouchStart={editable ? (e) => e.stopPropagation() : undefined}
                onTouchEnd={editable ? (e) => e.stopPropagation() : undefined}
                style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.wPct}%`, height: `${box.hPct}%` } as CSSProperties}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt="" draggable={false} />
                {editable && (
                  <>
                    {CORNERS.map((c) => (
                      <span
                        key={c}
                        className={s.handle}
                        data-corner={c}
                        aria-hidden
                        onPointerDown={(e) => start(pos, c, box, aspect, e)}
                      />
                    ))}
                    <span className={s.sizeTag} aria-hidden>
                      {cmText(box.w)} × {cmText(box.hCm)} cm
                    </span>
                  </>
                )}
              </span>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
