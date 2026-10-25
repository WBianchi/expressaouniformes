"use client";
import { Check, Copy } from "lucide-react";
import { money, positionFees, type Position, type Product } from "@/lib/catalog";
import { availablePositions } from "@/lib/mockup";
import { LogoUpload, type LogoValue } from "./LogoUpload";
import type { LogoSet } from "./useBrandLogo";
import s from "./Product.module.css";

export type PersonalizeProps = {
  positions: Position[];
  onPositions: (v: Position[]) => void;
  logos: LogoSet;
  onLogo: (position: Position, v: LogoValue) => void;
};

const hints: Record<Position, string> = {
  frente: "até 10 × 10 cm",
  costas: "até 28 × 35 cm",
  manga: "até 8 × 8 cm",
};

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
  fees,
  step,
}: PersonalizeProps & { product: Product; fees: boolean; step?: number }) {
  const available = availablePositions(product);
  const sent = positions.filter((p) => logos[p]).length;
  const toggle = (pos: Position, on: boolean) =>
    onPositions(on ? positions.filter((p) => p !== pos) : available.filter((p) => p === pos || positions.includes(p)));

  return (
    <section className={s.step} aria-labelledby="pz-title">
      <h2 id="pz-title" className={s.stepTitle}>
        {step && <span className={s.stepNum}>{step}</span>} Sua logo
        <span className={s.stepValue}>{sent ? `${sent} de ${positions.length} enviada${sent > 1 ? "s" : ""}` : "Opcional agora"}</span>
      </h2>
      <p className={s.note}>Marque onde aplicar e envie a arte de cada posição. Pode ser a mesma logo ou uma diferente em cada lugar.</p>

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
                  <small>{hints[pos]}</small>
                </span>
                {fees && <span className={s.posFee}>+ {money(positionFees[pos].fee)}</span>}
              </button>
              {on && (
                <div className={s.posSlot}>
                  <LogoUpload value={logos[pos] ?? null} onChange={(v) => onLogo(pos, v)} label={`Logo da ${positionFees[pos].label.toLowerCase()}`} compact />
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
    </section>
  );
}
