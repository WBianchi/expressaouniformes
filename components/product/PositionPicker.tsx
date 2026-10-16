"use client";
import { Check } from "lucide-react";
import { money, positionFees, type Position } from "@/lib/catalog";
import s from "./Product.module.css";

const hints: Record<Position, string> = {
  frente: "até 10 × 10 cm",
  costas: "até 28 × 35 cm",
  manga: "até 8 × 8 cm",
};

/** Posições da logo. Com `fees`, mostra o acréscimo por peça (linha pronta-entrega). */
export function PositionPicker({
  value,
  onChange,
  available = ["frente", "costas", "manga"],
  fees = true,
}: {
  value: Position[];
  onChange: (v: Position[]) => void;
  available?: Position[];
  fees?: boolean;
}) {
  return (
    <div className={s.positions} role="group" aria-label="Posições da logo">
      {available.map((pos) => {
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
            <span className={s.posCheck} aria-hidden>
              <Check size={12} strokeWidth={3} />
            </span>
            <span className={s.posText}>
              <b>{positionFees[pos].label}</b>
              <small>{hints[pos]}</small>
            </span>
            {fees && <span className={s.posFee}>+ {money(positionFees[pos].fee)}</span>}
          </button>
        );
      })}
    </div>
  );
}
