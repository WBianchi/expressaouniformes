"use client";
import type { Position, Product } from "@/lib/catalog";
import { availablePositions } from "@/lib/mockup";
import { LogoUpload, type LogoValue } from "./LogoUpload";
import { PositionPicker } from "./PositionPicker";
import s from "./Product.module.css";

export type PersonalizeProps = {
  positions: Position[];
  onPositions: (v: Position[]) => void;
  logo: LogoValue;
  onLogo: (v: LogoValue) => void;
};

/** Personalização única do site: logo + posições, com prévia na foto da peça. */
export function Personalize({
  product,
  positions,
  onPositions,
  logo,
  onLogo,
  fees,
  step,
}: PersonalizeProps & { product: Product; fees: boolean; step?: number }) {
  return (
    <section className={s.step} aria-labelledby="pz-title">
      <h2 id="pz-title" className={s.stepTitle}>
        {step && <span className={s.stepNum}>{step}</span>} Sua logo
        <span className={s.stepValue}>{logo ? "Veja a prévia na foto" : "Opcional agora"}</span>
      </h2>
      <LogoUpload value={logo} onChange={onLogo} />
      <p className={s.fieldLabel}>Onde aplicar</p>
      <PositionPicker value={positions} onChange={onPositions} available={availablePositions(product)} fees={fees} />
      {!positions.length && <p className={s.note}>Sem posição marcada, as peças vão lisas.</p>}
    </section>
  );
}
