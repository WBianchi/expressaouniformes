"use client";
import { Check, Copy, Crosshair, Minus, Move, Plus } from "lucide-react";
import { useState } from "react";
import { feeFor, money, positionFees, type Position, type Product, type Technique } from "@/lib/catalog";
import { artTechniques } from "@/lib/qualify";
import { areaCm, availablePositions, clampPlacement, cmText, logoBox, logoSpots, maxLogoCm, minLogoCm, type Placement, type Placements, type Spot } from "@/lib/mockup";
import { LogoUpload, type LogoValue } from "./LogoUpload";
import type { LogoSet } from "./useBrandLogo";
import { useLogoAspects } from "./useLogoAspect";
import s from "./Product.module.css";

export type PersonalizeProps = {
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

const techHint = (t: Technique) =>
  artTechniques.find((a) => a.label === t)?.hint ?? "";

/** "até 10 × 10 cm": o tamanho real da área de aplicação da posição nesta peça */
const hint = (spot: Spot | undefined, technique: Technique | null) => {
  if (!spot) return "";
  // limite da técnica (ex.: bordado nas costas) vale no lugar do tamanho da área
  if (spot.cap) return `até ${spot.cap.w} × ${spot.cap.h} cm no ${technique?.toLowerCase() ?? "bordado"}`;
  const a = areaCm(spot);
  return `até ${Math.round(a.w)} × ${Math.round(a.h)} cm`;
};

const parseCm = (v: string) => Number(v.replace(",", ".").replace(/[^\d.]/g, ""));

/**
 * Tamanho da logo em cm: botões − e +, campo para digitar a largura e régua.
 * A altura sai da proporção da imagem; o máximo é o que cabe inteiro na área da posição.
 */
function SizeControl({ label, spot, aspect, placement, onPlace }: { label: string; spot: Spot; aspect: number; placement: Placements[Position]; onPlace: (v: Placement) => void }) {
  const box = logoBox(spot, placement, aspect);
  const min = minLogoCm(spot, aspect);
  const max = maxLogoCm(spot, aspect);
  const [text, setText] = useState<string | null>(null);
  const set = (w: number) => onPlace(clampPlacement({ x: box.x, y: box.y, w }, spot, aspect));
  const commit = () => {
    if (text === null) return;
    const n = parseCm(text);
    if (Number.isFinite(n) && n > 0) set(n);
    setText(null);
  };
  return (
    <div className={s.sizeCtl}>
      <div className={s.sizeRow}>
        <span className={s.sizeLabel}>Largura</span>
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
        <span className={s.sizeOut}>
          × {cmText(box.hCm)} cm de altura
        </span>
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
      <small className={s.sizeHint}>
        De {cmText(min)} a {cmText(max)} cm de largura nesta posição. A proporção da sua logo é mantida.
      </small>
    </div>
  );
}

/**
 * Personalização única do site: o cliente marca onde aplicar e envia uma logo
 * para cada posição (pode ser a mesma ou diferente). Prévia na foto da peça.
 */
export function Personalize({
  product,
  positions,
  onPositions,
  logos,
  onLogo,
  placements,
  onPlace,
  technique,
  onTechnique,
  fees,
  step,
}: PersonalizeProps & { product: Product; fees: boolean; step?: number }) {
  const available = availablePositions(product);
  const spots = logoSpots(product, technique);
  const aspectOf = useLogoAspects(available.map((p) => logos[p]?.thumb));
  const sent = positions.filter((p) => logos[p]).length;
  const toggle = (pos: Position, on: boolean) =>
    onPositions(on ? positions.filter((p) => p !== pos) : available.filter((p) => p === pos || positions.includes(p)));

  return (
    <section className={s.step} aria-labelledby="pz-title">
      <h2 id="pz-title" className={s.stepTitle}>
        {step && <span className={s.stepNum}>{step}</span>} Sua logo
        <span className={s.stepValue}>{sent ? `${sent} de ${positions.length} enviada${sent > 1 ? "s" : ""}` : "Opcional agora"}</span>
      </h2>
      <p className={s.note}>Marque onde aplicar e envie a arte de cada posição (pode ser a mesma ou diferente). A logo entra centralizada na área da posição; arraste na foto para ajustar o lugar (ela não sai da área) e escolha o tamanho em centímetros.</p>

      <div className={s.positions} role="group" aria-label="Posições da logo">
        {available.map((pos) => {
          const on = positions.includes(pos);
          const others = (Object.keys(logos) as Position[]).filter((p) => p !== pos && logos[p]?.thumb !== logos[pos]?.thumb);
          return (
            <div key={pos} className={s.posItem} data-active={on || undefined}>
              <button type="button" className={s.posCard} data-active={on || undefined} aria-pressed={on} onClick={() => toggle(pos, on)}>
                <span className={s.posCheck} aria-hidden>
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className={s.posText}>
                  <b>{positionFees[pos].label}</b>
                  <small>{hint(spots[pos], technique)}</small>
                </span>
                {fees && <span className={s.posFee}>+ {money(feeFor(product, technique, pos))}</span>}
              </button>
              {on && (
                <div className={s.posSlot}>
                  <LogoUpload value={logos[pos] ?? null} onChange={(v) => onLogo(pos, v)} label={`Logo da ${positionFees[pos].label.toLowerCase()}`} compact keepOriginal />
                  {logos[pos] && spots[pos] && (
                    <div className={s.posAdjust}>
                      <SizeControl
                        label={`logo da ${positionFees[pos].label.toLowerCase()}`}
                        spot={spots[pos]!}
                        aspect={aspectOf(logos[pos]?.thumb)}
                        placement={placements[pos]}
                        onPlace={(v) => onPlace(pos, v)}
                      />
                      {placements[pos] ? (
                        <button type="button" className={s.posCopyBtn} onClick={() => onPlace(pos, null)}>
                          <Crosshair size={13} /> Centralizar na área
                        </button>
                      ) : (
                        <span className={s.posHint}>
                          <Move size={13} /> Arraste na foto para ajustar o lugar
                        </span>
                      )}
                    </div>
                  )}
                  {!logos[pos] && others.length > 0 && (
                    <div className={s.posCopy}>
                      {others.map((p) => (
                        <button key={p} type="button" className={s.posCopyBtn} onClick={() => onLogo(pos, logos[p]!)}>
                          <Copy size={13} /> Usar a mesma da {positionFees[p].label.split(" ")[0].toLowerCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!positions.length && <p className={s.note}>Sem posição marcada, as peças vão lisas.</p>}

      {positions.length > 0 && product.techniques.length > 0 && (
        <div className={s.techBlock}>
          <p className={s.fieldLabel}>
            Como aplicar a logo <span className={s.techOptional}>o preço da personalização muda conforme a técnica</span>
          </p>
          <div className={s.techGrid} role="radiogroup" aria-label="Técnica de aplicação">
            {product.techniques.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={technique === t}
                className={s.techCard}
                onClick={() => onTechnique(t)}
              >
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
