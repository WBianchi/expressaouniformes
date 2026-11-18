"use client";
// Peça grande do simulador na vista da área escolhida: a logo anda livre pela peça (sem sair dela
// nem passar para outra vista), os cantos mudam o tamanho, e há zoom para ver de perto.
import { Crosshair, Maximize2, Minus, Plus, RotateCcw, Scan, Trash2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import type { Position, Product, Technique } from "@/lib/catalog";
import { cmText, logoBox, maxLogoCm, moveWithin, resizePlacement, type Fits, type Placement, type Placements, type Spot } from "@/lib/mockup";
import { LogoMockup } from "./LogoMockup";
import type { LogoValue } from "./LogoUpload";
import x from "./Simulator.module.css";

export const VIEW_NAME: Record<Position, string> = { frente: "Frente", costas: "Costas", manga: "Manga esquerda", "manga-direita": "Manga direita" };
/** "na frente", "nas costas", "na manga esquerda" */
export const AT: Record<Position, string> = { frente: "na frente", costas: "nas costas", manga: "na manga esquerda", "manga-direita": "na manga direita" };
/** "da frente", "das costas", "da manga esquerda" */
export const OF: Record<Position, string> = { frente: "da frente", costas: "das costas", manga: "da manga esquerda", "manga-direita": "da manga direita" };

const ZOOMS = [1, 1.25, 1.5, 2, 2.5, 3];

export function SimStage({
  product,
  pos,
  spot,
  included,
  logo,
  placements,
  aspect,
  fits,
  color,
  tint,
  technique,
  onPlace,
  onInclude,
  onRemoveLogo,
}: {
  product: Product;
  pos: Position;
  spot: Spot;
  /** a área está no pedido */
  included: boolean;
  logo?: NonNullable<LogoValue>;
  placements: Placements;
  aspect: number;
  fits?: Fits;
  color: string;
  tint: string | null;
  technique: Technique | null;
  onPlace: (pos: Position, v: Placement | null) => void;
  onInclude: () => void;
  onRemoveLogo: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);
  // ponto da peça (0–1) que fica no meio da tela depois do zoom
  const focus = useRef<{ x: number; y: number } | null>(null);
  const box = logo ? logoBox(spot, placements[pos], aspect) : null;
  const placement = placements[pos];

  const zoomTo = (z: number) => {
    const el = viewport.current;
    if (el)
      // aproxima na logo, se houver; senão mantém o meio da tela
      focus.current = box
        ? { x: box.x / 100, y: box.y / 100 }
        : { x: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth, y: (el.scrollTop + el.clientHeight / 2) / el.scrollHeight };
    setZoom(z);
  };
  useLayoutEffect(() => {
    const el = viewport.current;
    const f = focus.current;
    if (!el || !f) return;
    el.scrollLeft = f.x * el.scrollWidth - el.clientWidth / 2;
    el.scrollTop = f.y * el.scrollHeight - el.clientHeight / 2;
    focus.current = null;
  }, [zoom]);
  const zi = ZOOMS.indexOf(zoom);

  // centraliza a logo na peça (na manga, no meio da manga), na mesma altura
  const center = () => box && onPlace(pos, moveWithin(box, { x: spot.view === "front" || spot.view === "back" ? 50 : spot.x, y: box.y }, spot, aspect, fits));
  // o maior tamanho que cabe (a logo anda o mínimo para caber na peça)
  const biggest = () => box && onPlace(pos, resizePlacement(placement, maxLogoCm(spot, aspect), spot, aspect, fits));
  const reset = () => onPlace(pos, null);

  return (
    <div className={x.stage}>
      <div className={x.viewport} ref={viewport} data-zoom={zoom > 1 || undefined}>
        <div className={x.canvas} style={{ width: `${zoom * 100}%` }}>
          <LogoMockup
            product={product}
            view={spot.view}
            positions={included ? [pos] : []}
            logos={{ [pos]: logo?.thumb }}
            placements={placements}
            onPlace={(p, v) => onPlace(p, v)}
            fits={fits}
            color={color}
            tint={tint}
            technique={technique}
            priority
            tools={() =>
              box && (
                <>
                  <span>
                    {cmText(box.w)} × {cmText(box.hCm)} cm
                  </span>
                  {placement && (
                    <button type="button" onClick={reset} aria-label="Voltar a logo para o lugar padrão" title="Voltar para o lugar padrão">
                      <RotateCcw size={16} />
                    </button>
                  )}
                  <button type="button" onClick={onRemoveLogo} aria-label="Remover a logo desta área" title="Remover a logo">
                    <Trash2 size={16} />
                  </button>
                </>
              )
            }
          />
        </div>
      </div>

      <span className={x.stageTag}>{VIEW_NAME[pos]}</span>

      <div className={x.toolbar} role="toolbar" aria-label="Ajustes da logo" aria-orientation="vertical">
        <button type="button" className={x.toolBtn} onClick={center} disabled={!box} aria-label="Centralizar a logo" title="Centralizar">
          <Crosshair size={19} />
        </button>
        <button type="button" className={x.toolBtn} onClick={biggest} disabled={!box} aria-label="Logo no maior tamanho que cabe" title="Maior tamanho">
          <Maximize2 size={18} />
        </button>
        <button type="button" className={x.toolBtn} onClick={reset} disabled={!box || !placement} aria-label="Voltar a logo para o lugar padrão" title="Lugar padrão">
          <RotateCcw size={18} />
        </button>
        <button type="button" className={x.toolBtn} onClick={() => zoomTo(1)} disabled={zoom === 1} aria-label="Ver a peça inteira" title="Ver a peça inteira">
          <Scan size={18} />
        </button>
      </div>

      {!included && (
        <button type="button" className={x.addBtn} onClick={onInclude}>
          <Plus size={17} /> Logo {AT[pos]}
        </button>
      )}

      <div className={x.zoom} role="group" aria-label="Zoom">
        <button type="button" onClick={() => zoomTo(ZOOMS[zi - 1])} disabled={zi <= 0} aria-label="Diminuir o zoom">
          <Minus size={17} />
        </button>
        <output aria-live="polite">{Math.round(zoom * 100)}%</output>
        <button type="button" onClick={() => zoomTo(ZOOMS[zi + 1])} disabled={zi >= ZOOMS.length - 1} aria-label="Aumentar o zoom">
          <Plus size={17} />
        </button>
      </div>
    </div>
  );
}
