"use client";
// Simulador da logo (estilo "estúdio"): todas as vistas da peça abertas lado a lado (frente,
// costas e manga), cada uma com a sua logo. O cliente arrasta a logo para qualquer lugar da peça
// naquela vista (não sai do contorno da peça, nem passa para outra vista) e puxa os cantos para
// aumentar ou diminuir; embaixo de cada vista ficam o envio da arte e o tamanho em cm.
import { Check, Copy, Minus, Move, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";
import { feeFor, getColor, money, positionFees, tintFor, type Position, type Product, type Technique } from "@/lib/catalog";
import { artTechniques } from "@/lib/qualify";
import { availablePositions, cmText, logoBox, logoSpots, maxLogoCm, minLogoCm, resizePlacement, type Fits, type Placement, type Placements, type Spot } from "@/lib/mockup";
import { Swatches } from "@/components/ui/primitives";
import { LogoMockup, usePiecePhoto } from "./LogoMockup";
import { LogoUpload, type LogoValue } from "./LogoUpload";
import type { LogoSet } from "./useBrandLogo";
import { useLogoAspects } from "./useLogoAspect";
import { usePieceFit } from "./usePieceFit";
import s from "./Product.module.css";
import st from "./Studio.module.css";

export type StudioProps = {
  color: string;
  onColor: (id: string) => void;
  positions: Position[];
  onPositions: (v: Position[]) => void;
  logos: LogoSet;
  onLogo: (position: Position, v: LogoValue) => void;
  /** posição/tamanho ajustados pelo cliente */
  placements: Placements;
  /** null = volta para a posição padrão */
  onPlace: (position: Position, v: Placement | null) => void;
  /** técnica de aplicação da logo (silk, bordado, DTF, sublimação) */
  technique: Technique | null;
  onTechnique: (v: Technique | null) => void;
};

const VIEW_NAME: Record<Position, string> = { frente: "Frente", costas: "Costas", manga: "Manga" };
/** "na frente", "nas costas", "na manga" */
const AT: Record<Position, string> = { frente: "na frente", costas: "nas costas", manga: "na manga" };

const techHint = (t: Technique) => artTechniques.find((a) => a.label === t)?.hint ?? "";

/** "até 28 × 35 cm": o maior tamanho da logo nesta posição (com o limite da técnica, se houver) */
const sizeHint = (spot: Spot, technique: Technique | null) => {
  const w = Math.min(spot.max.w, spot.cap?.w ?? Infinity);
  const h = Math.min(spot.max.h, spot.cap?.h ?? Infinity);
  return `até ${Math.round(w)} × ${Math.round(h)} cm${spot.cap ? ` no ${technique?.toLowerCase() ?? "bordado"}` : ""}`;
};

const parseCm = (v: string) => Number(v.replace(",", ".").replace(/[^\d.]/g, ""));

/**
 * Tamanho da logo em cm: botões − e +, campo para digitar a largura e régua (o mesmo que puxar
 * os cantos na foto). A altura sai da proporção da imagem.
 */
function SizeControl({ label, spot, aspect, placement, fits, onPlace }: { label: string; spot: Spot; aspect: number; placement: Placements[Position]; fits?: Fits; onPlace: (v: Placement) => void }) {
  const box = logoBox(spot, placement, aspect);
  const min = minLogoCm(spot, aspect);
  const max = maxLogoCm(spot, aspect);
  const [text, setText] = useState<string | null>(null);
  // a logo cresce sem sair do lugar (nas costas, o alto dela fica onde está) e sem sair da peça
  const set = (w: number) => onPlace(resizePlacement(placement, w, spot, aspect, fits));
  const commit = () => {
    if (text === null) return;
    const n = parseCm(text);
    if (Number.isFinite(n) && n > 0) set(n);
    setText(null);
  };
  return (
    <div className={s.sizeCtl}>
      <div className={s.sizeRow}>
        <button type="button" className={s.sizeBtn} onClick={() => set(box.w - 0.5)} disabled={box.w <= min} aria-label={`Diminuir a ${label}`}>
          <Minus size={15} />
        </button>
        <label className={s.sizeInput}>
          <input
            inputMode="decimal"
            value={text ?? cmText(box.w)}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), commit())}
            aria-label={`Largura da ${label} em centímetros`}
          />
          cm
        </label>
        <button type="button" className={s.sizeBtn} onClick={() => set(box.w + 0.5)} disabled={box.w >= max} aria-label={`Aumentar a ${label}`}>
          <Plus size={15} />
        </button>
        <span className={s.sizeOut}>× {cmText(box.hCm)} cm</span>
      </div>
      <input
        type="range"
        className={s.sizeRange}
        min={min}
        max={max}
        step={0.1}
        value={box.w}
        onChange={(e) => set(Number(e.target.value))}
        aria-label={`Tamanho da ${label}`}
        aria-valuetext={`${cmText(box.w)} por ${cmText(box.hCm)} centímetros`}
      />
    </div>
  );
}

/** Uma vista da peça (frente, costas ou manga) com a logo da posição e os controles dela embaixo. */
function ViewCard({
  product,
  pos,
  spot,
  fees,
  priority,
  color,
  positions,
  onToggle,
  logos,
  onLogo,
  placements,
  onPlace,
  technique,
}: Omit<StudioProps, "onColor" | "onPositions" | "onTechnique"> & { product: Product; pos: Position; spot: Spot; fees: boolean; priority?: boolean; onToggle: (pos: Position, on: boolean) => void }) {
  const on = positions.includes(pos);
  const logo = logos[pos];
  const tint = tintFor(product, color);
  const photo = usePiecePhoto(product, spot.view, color, tint);
  const fits = usePieceFit(photo.base);
  const aspectOf = useLogoAspects([logo?.thumb]);
  const aspect = aspectOf(logo?.thumb);
  const name = positionFees[pos].label;
  // logos já enviadas em outras posições (para repetir a mesma arte)
  const others = (Object.keys(logos) as Position[]).filter((p) => p !== pos && logos[p] && logos[p]?.thumb !== logo?.thumb);

  return (
    <article className={st.view} data-on={on || undefined} aria-label={VIEW_NAME[pos]}>
      <div className={st.stage}>
        <LogoMockup
          product={product}
          view={spot.view}
          positions={on ? [pos] : []}
          logos={{ [pos]: logo?.thumb }}
          placements={placements}
          onPlace={(p, v) => onPlace(p, v)}
          fits={fits}
          color={color}
          tint={tint}
          technique={technique}
          priority={priority}
        />
        <span className={st.viewLabel}>{VIEW_NAME[pos]}</span>
        {!on && (
          <button type="button" className={st.addBtn} onClick={() => onToggle(pos, false)}>
            <Plus size={16} /> Logo {AT[pos]}
          </button>
        )}
      </div>

      <div className={st.panel}>
        <button type="button" className={s.posCard} data-active={on || undefined} aria-pressed={on} onClick={() => onToggle(pos, on)}>
          <span className={s.posCheck} aria-hidden>
            <Check size={12} strokeWidth={3} />
          </span>
          <span className={`${s.posText} ${st.posText}`}>
            <b>{name}</b>
            <small>{sizeHint(spot, technique)}</small>
          </span>
          {fees && <span className={s.posFee}>+ {money(feeFor(product, technique, pos))}</span>}
        </button>

        {on && (
          <div className={st.panelBody}>
            <LogoUpload value={logo ?? null} onChange={(v) => onLogo(pos, v)} label={`Logo da ${name.toLowerCase()}`} compact keepOriginal />
            {logo ? (
              <>
                <SizeControl label={`logo da ${name.toLowerCase()}`} spot={spot} aspect={aspect} placement={placements[pos]} fits={fits} onPlace={(v) => onPlace(pos, v)} />
                {placements[pos] && (
                  <button type="button" className={s.posCopyBtn} onClick={() => onPlace(pos, null)}>
                    <RotateCcw size={13} /> {spot.top ? "Voltar para o alto das costas" : "Voltar para o lugar padrão"}
                  </button>
                )}
              </>
            ) : (
              others.length > 0 && (
                <div className={s.posCopy}>
                  {others.map((p) => (
                    <button key={p} type="button" className={s.posCopyBtn} onClick={() => onLogo(pos, logos[p]!)}>
                      <Copy size={13} /> Usar a mesma da {positionFees[p].label.split(" ")[0].toLowerCase()}
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * Estúdio do simulador: cor, as vistas da peça com a logo de cada posição e a técnica.
 * `fees`: mostra o preço de cada posição e técnica (compra online).
 */
export function Studio({ product, fees, color, onColor, positions, onPositions, logos, onLogo, placements, onPlace, technique, onTechnique }: StudioProps & { product: Product; fees: boolean }) {
  const available = availablePositions(product);
  const spots = logoSpots(product, technique);
  const colorName = getColor(color)?.name ?? "";
  const sent = positions.filter((p) => logos[p]).length;
  const toggle = (pos: Position, on: boolean) => onPositions(on ? positions.filter((p) => p !== pos) : available.filter((p) => p === pos || positions.includes(p)));

  return (
    <section className={st.studio} aria-labelledby="sim-title">
      <div className={st.bar}>
        <div className={st.colorStep}>
          <h2 className={s.stepTitle}>
            <span className={s.stepNum}>1</span> Cor <span className={s.stepValue}>{colorName}</span>
          </h2>
          <Swatches ids={product.colors} value={color} onChange={onColor} size="lg" />
        </div>
        <div className={st.logoStep}>
          <h2 id="sim-title" className={s.stepTitle}>
            <span className={s.stepNum}>2</span> Sua logo na peça
            <span className={s.stepValue}>{sent ? `${sent} de ${positions.length} enviada${sent > 1 ? "s" : ""}` : "Opcional agora"}</span>
          </h2>
          <p className={st.tip}>
            <Move size={14} /> Envie a arte embaixo de cada vista. Na foto, arraste a logo para mover e puxe os cantos para aumentar ou diminuir.
          </p>
        </div>
      </div>

      <div className={st.views} data-count={available.length} style={{ ["--n" as string]: available.length }}>
        {available.map((pos, i) => (
          <ViewCard
            key={pos}
            product={product}
            pos={pos}
            spot={spots[pos]!}
            fees={fees}
            priority={i === 0}
            color={color}
            positions={positions}
            onToggle={toggle}
            logos={logos}
            onLogo={onLogo}
            placements={placements}
            onPlace={onPlace}
            technique={technique}
          />
        ))}
      </div>
      {!positions.length && <p className={s.note}>Sem posição marcada, as peças vão lisas.</p>}

      {positions.length > 0 && product.techniques.length > 0 && (
        <div className={st.techStep}>
          <h2 className={s.stepTitle}>
            <span className={s.stepNum}>3</span> Como aplicar a logo <span className={s.techOptional}>o preço da personalização muda conforme a técnica</span>
          </h2>
          <div className={s.techGrid} role="radiogroup" aria-label="Técnica de aplicação">
            {product.techniques.map((t) => (
              <button key={t} type="button" role="radio" aria-checked={technique === t} className={s.techCard} onClick={() => onTechnique(t)}>
                <b>{t}</b>
                {fees && (
                  <span className={s.techFee}>
                    + {money(positions.reduce((sum, pos) => sum + feeFor(product, t, pos), 0))}
                    /peça
                  </span>
                )}
                <small>{techHint(t)}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
