"use client";
// Aba "Personalizar" do simulador: em qual área vai a logo, o arquivo dela, o tamanho em cm
// (largura e altura, sempre na proporção da logo) e a técnica de aplicação.
import { Check, ChevronDown, ChevronUp, Copy, Link2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { feeFor, money, type Position, type Product, type Technique } from "@/lib/catalog";
import { artTechniques } from "@/lib/qualify";
import { cmText, logoBox, maxLogoCm, minLogoCm, resizePlacement, type Fits, type Placement, type Placements, type Spot } from "@/lib/mockup";
import { LogoUpload, type LogoValue } from "./LogoUpload";
import { AT, OF } from "./SimStage";
import type { LogoSet } from "./useBrandLogo";
import x from "./Simulator.module.css";

/** Nome da área no cartão e o detalhe embaixo. */
const AREA: Record<Position, [string, string]> = {
  frente: ["Frente", "peito ou centro"],
  costas: ["Costas", "alto ou centro"],
  manga: ["Manga", "esquerda"],
  "manga-direita": ["Manga", "direita"],
};

const techHint = (t: Technique) => artTechniques.find((a) => a.label === t)?.hint ?? "";
const parseCm = (v: string) => Number(v.replace(",", ".").replace(/[^\d.]/g, ""));

/** Camiseta desenhada com a área marcada (peito esquerdo de quem veste fica à direita do desenho). */
function AreaIcon({ pos }: { pos: Position }) {
  const back = pos === "costas";
  const body = `M16 6 9.5 8.5 3 15l5 6 4-3v24h24V18l4 3 5-6-6.5-6.5L32 6${back ? "c-1.5 2-4.5 3-8 3s-6.5-1-8-3Z" : "c-1 3.5-4 5.5-8 5.5S17 9.5 16 6Z"}`;
  return (
    <svg viewBox="0 0 48 48" className={x.areaIcon} aria-hidden>
      {pos === "manga" && <path d="M38.5 8.5 45 15l-5 6-4-3V9.6Z" className={x.areaMark} />}
      {pos === "manga-direita" && <path d="M9.5 8.5 3 15l5 6 4-3V9.6Z" className={x.areaMark} />}
      <path d={body} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      {pos === "frente" && <rect x="26.5" y="15" width="6" height="6" rx="1" className={x.areaMark} />}
      {back && <rect x="18" y="13" width="12" height="8" rx="1" className={x.areaMark} />}
    </svg>
  );
}

/** Campo de medida (cm) com setas para subir e descer meio centímetro. */
function CmField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (cm: number) => void }) {
  const [text, setText] = useState<string | null>(null);
  const commit = () => {
    if (text === null) return;
    const n = parseCm(text);
    if (Number.isFinite(n) && n > 0) onChange(n);
    setText(null);
  };
  return (
    <label className={x.cmField}>
      <span>{label}</span>
      <span className={x.cmBox}>
        <input
          inputMode="decimal"
          value={text ?? cmText(value)}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.preventDefault(), commit());
            else if (e.key === "ArrowUp" || e.key === "ArrowDown") (e.preventDefault(), onChange(value + (e.key === "ArrowUp" ? 0.5 : -0.5)));
          }}
          aria-label={`${label} da logo em centímetros`}
        />
        <small>cm</small>
        <span className={x.cmSteps}>
          <button type="button" tabIndex={-1} onClick={() => onChange(value + 0.5)} disabled={value >= max} aria-label={`Aumentar a ${label.toLowerCase()}`}>
            <ChevronUp size={14} />
          </button>
          <button type="button" tabIndex={-1} onClick={() => onChange(value - 0.5)} disabled={value <= min} aria-label={`Diminuir a ${label.toLowerCase()}`}>
            <ChevronDown size={14} />
          </button>
        </span>
      </span>
    </label>
  );
}

export function SimPanel({
  product,
  fees,
  available,
  active,
  onActive,
  positions,
  onInclude,
  onExclude,
  logos,
  onLogo,
  placements,
  onPlace,
  spot,
  aspect,
  fits,
  technique,
  onTechnique,
}: {
  product: Product;
  /** mostra o preço de cada área e técnica (compra online) */
  fees: boolean;
  available: Position[];
  active: Position;
  onActive: (pos: Position) => void;
  positions: Position[];
  onInclude: (pos: Position) => void;
  onExclude: (pos: Position) => void;
  logos: LogoSet;
  onLogo: (pos: Position, v: LogoValue) => void;
  placements: Placements;
  onPlace: (pos: Position, v: Placement | null) => void;
  spot: Spot;
  aspect: number;
  fits?: Fits;
  technique: Technique | null;
  onTechnique: (t: Technique) => void;
}) {
  const included = positions.includes(active);
  const logo = logos[active];
  const placement = placements[active];
  const box = logoBox(spot, placement, aspect);
  const min = minLogoCm(spot, aspect);
  const max = maxLogoCm(spot, aspect);
  // a logo cresce sem sair do lugar (nas costas, o alto dela fica onde está) e sem sair da peça
  const setWidth = (w: number) => onPlace(active, resizePlacement(placement, w, spot, aspect, fits));
  // logos já enviadas em outras áreas (para repetir a mesma arte)
  const others = available.filter((p) => p !== active && logos[p] && logos[p]?.thumb !== logo?.thumb);
  const maxText = `${cmText(Math.min(spot.max.w, spot.cap?.w ?? Infinity))} × ${cmText(Math.min(spot.max.h, spot.cap?.h ?? Infinity))} cm`;

  return (
    <div className={x.tabBody}>
      <section className={x.group} aria-labelledby="sim-area">
        <h3 id="sim-area" className={x.groupTitle}>
          Área de aplicação
        </h3>
        <div className={x.areas}>
          {available.map((pos) => {
            const on = positions.includes(pos);
            return (
              <button
                key={pos}
                type="button"
                className={x.area}
                aria-pressed={active === pos}
                data-on={on || undefined}
                onClick={() => {
                  onActive(pos);
                  onInclude(pos);
                }}
              >
                <AreaIcon pos={pos} />
                <span className={x.areaText}>
                  <b>{AREA[pos][0]}</b>
                  <small>({AREA[pos][1]})</small>
                  {fees && <small className={x.areaFee}>+ {money(feeFor(product, technique, pos))}</small>}
                </span>
                {on && (
                  <span className={x.areaCheck} aria-label="no pedido">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {!positions.length && <p className={x.hint}>Sem área marcada, as peças vão lisas.</p>}
      </section>

      <section className={x.group} aria-labelledby="sim-logo">
        <h3 id="sim-logo" className={x.groupTitle}>
          Sua logo <span>{AT[active]}</span>
        </h3>
        <LogoUpload value={logo ?? null} onChange={(v) => onLogo(active, v)} label={`Logo ${OF[active]}`} compact keepOriginal card />
        {!logo && others.length > 0 && (
          <div className={x.copyRow}>
            {others.map((p) => (
              <button key={p} type="button" className={x.linkBtn} onClick={() => onLogo(active, logos[p]!)}>
                <Copy size={13} /> Usar a mesma logo {OF[p]}
              </button>
            ))}
          </div>
        )}
        {!logo && included && (
          <button type="button" className={x.linkBtn} onClick={() => onExclude(active)}>
            Tirar a logo {AT[active]} do pedido
          </button>
        )}
        {!logo && !included && fees && <p className={x.hint}>+ {money(feeFor(product, technique, active))} por peça com logo {AT[active]}.</p>}
      </section>

      {logo && (
        <section className={x.group} aria-labelledby="sim-size">
          <h3 id="sim-size" className={x.groupTitle}>
            Tamanho da estampa <span>até {maxText}</span>
          </h3>
          <div className={x.sizeRow}>
            <CmField label="Largura" value={box.w} min={min} max={max} onChange={setWidth} />
            <span className={x.lock} title="A altura acompanha a largura (a logo não deforma)">
              <Link2 size={17} />
            </span>
            <CmField label="Altura" value={box.hCm} min={min / aspect} max={max / aspect} onChange={(h) => setWidth(h * aspect)} />
          </div>
          <p className={x.hint}>Na foto, arraste a logo para mover e puxe os cantos para aumentar ou diminuir.</p>
          {placement && (
            <button type="button" className={x.linkBtn} onClick={() => onPlace(active, null)}>
              <RotateCcw size={13} /> {spot.top ? "Voltar para o alto das costas" : "Voltar para o lugar padrão"}
            </button>
          )}
        </section>
      )}

      {positions.length > 0 && product.techniques.length > 0 && (
        <section className={x.group} aria-labelledby="sim-tech">
          <h3 id="sim-tech" className={x.groupTitle}>
            Técnica de personalização
          </h3>
          <div className={x.techs} role="radiogroup" aria-labelledby="sim-tech">
            {product.techniques.map((t) => (
              <button key={t} type="button" role="radio" aria-checked={technique === t} className={x.tech} onClick={() => onTechnique(t)}>
                <span className={x.radio} aria-hidden />
                <span className={x.techText}>
                  <b>{t}</b>
                  <small>{techHint(t)}</small>
                </span>
                {fees && <span className={x.techFee}>+ {money(positions.reduce((sum, pos) => sum + feeFor(product, t, pos), 0))}/pç</span>}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
