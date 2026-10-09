"use client";
import { Check } from "lucide-react";
import { money, positionFees, type Position } from "@/lib/catalog";
import s from "./Product.module.css";

const SHIRT = "M22 8 14 11 5 19l6 8 5-4v33h32V23l5 4 6-8-9-8-8-3c-2 4-6 6-10 6s-8-2-10-6Z";

function PositionArt({ pos }: { pos: Position }) {
  return (
    <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden className={s.posArt}>
      <path d={SHIRT} className={s.posShirt} />
      {pos === "costas" ? (
        <path d="M24 8.6c2 2 5 3 8 3s6-1 8-3" className={s.posSeam} />
      ) : (
        <path d="M22 8c2 4 6 6 10 6s8-2 10-6M32 14v9" className={s.posSeam} />
      )}
      {pos === "frente" && <rect x="36" y="20" width="8" height="7" rx="1.5" className={s.posMark} />}
      {pos === "costas" && <rect x="22" y="20" width="20" height="16" rx="2" className={s.posMark} />}
      {pos === "manga" && <rect x="7.5" y="17" width="7" height="6" rx="1.5" transform="rotate(38 11 20)" className={s.posMark} />}
    </svg>
  );
}

const hints: Record<Position, string> = {
  frente: "Até 10 × 10 cm",
  costas: "Até 28 × 35 cm",
  manga: "Até 8 × 8 cm",
};

export function PositionPicker({ value, onChange }: { value: Position[]; onChange: (v: Position[]) => void }) {
  return (
    <div className={s.positions} role="group" aria-label="Posições da logo">
      {(Object.keys(positionFees) as Position[]).map((pos) => {
        const on = value.includes(pos);
        return (
          <button
            key={pos}
            type="button"
            className={s.posCard}
            data-active={on || undefined}
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((p) => p !== pos) : [...value, pos])}
          >
            <span className={s.posCheck} aria-hidden><Check size={12} strokeWidth={3} /></span>
            <PositionArt pos={pos} />
            <b>{positionFees[pos].label}</b>
            <small>{hints[pos]}</small>
            <span className={s.posFee}>+ {money(positionFees[pos].fee)}/peça</span>
          </button>
        );
      })}
    </div>
  );
}
