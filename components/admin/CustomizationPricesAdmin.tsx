"use client";
// Painel → Preços do simulador: quanto cada técnica custa em cada posição da peça (R$ por peça).
// Vale para todas as peças de pronta-entrega: o cliente escolhe a técnica no simulador e vê o preço;
// o checkout cobra por esta tabela. Pedidos de fabricação (orçamento) não usam esta tabela.
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { positionFees, type CustomizationFees, type Position, type Technique } from "@/lib/catalog";
import { POSITION_OPTIONS, TECHNIQUE_OPTIONS } from "@/lib/listing";
import { TECHNIQUE_CAPS } from "@/lib/mockup";
import { saveCustomizationFees } from "@/app/admin/settings-actions";
import { useAction } from "./MediaAdmin";
import m from "./MediaAdmin.module.css";
import s from "./ListingsAdmin.module.css";

const key = (t: Technique, pos: Position) => `${t}|${pos}`;
const moneyText = (n: number) => n.toFixed(2).replace(".", ",");
const parseMoney = (v: string) => {
  const t = v.replace(/[^\d,.]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  return t ? Number(t) : NaN;
};
const textOf = (fees: CustomizationFees) =>
  Object.fromEntries(
    TECHNIQUE_OPTIONS.flatMap((t) => POSITION_OPTIONS.map((pos) => [key(t, pos), moneyText(fees[t]?.[pos] ?? positionFees[pos].fee)])),
  ) as Record<string, string>;

export function CustomizationPricesAdmin({ fees, enabled }: { fees: CustomizationFees; enabled: boolean }) {
  const { pending, error, setError, run } = useAction();
  const initial = textOf(fees);
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(text) !== JSON.stringify(initial);

  const save = () => {
    const next: CustomizationFees = {};
    for (const t of TECHNIQUE_OPTIONS)
      for (const pos of POSITION_OPTIONS) {
        const v = parseMoney(text[key(t, pos)] ?? "");
        if (!Number.isFinite(v) || v < 0) return setError(`Preço inválido: ${t}, ${positionFees[pos].label.toLowerCase()}.`);
        (next[t] ??= {})[pos] = Math.round(v * 100) / 100;
      }
    setSaved(false);
    run(
      () => saveCustomizationFees(next),
      () => {
        // mostra os valores como ficaram salvos (ex.: "5" vira "5,00") e mantém o aviso de salvo
        setText(textOf(next));
        setSaved(true);
      },
    );
  };

  return (
    <div className="admin-panel">
      <div className="panel-heading">
        <div>
          <h3>Preços da personalização no simulador</h3>
          <p>
            Quanto a logo soma ao preço de cada peça, por técnica e por posição. Vale para todas as peças de pronta-entrega: no simulador, o cliente
            escolhe a técnica e já vê o valor; o pagamento cobra por esta tabela. Pedidos de fabricação (orçamento com o vendedor) não usam esta tabela.
          </p>
        </div>
      </div>
      <div className={`${s.body} ${s.stack}`}>
        {!enabled && <p className={m.note}>Banco de dados não configurado: não é possível salvar os preços.</p>}
        <div className={s.feeTable} role="table" aria-label="Preço da personalização por técnica e posição">
          <div role="row" className={s.feeRow}>
            <span role="columnheader">Técnica</span>
            {POSITION_OPTIONS.map((pos) => (
              <span key={pos} role="columnheader">
                {pos === "manga" ? "Manga (cada uma)" : positionFees[pos].label}
              </span>
            ))}
          </div>
          {TECHNIQUE_OPTIONS.map((t) => (
            <div key={t} role="row" className={s.feeRow}>
              <span role="rowheader">
                <b>{t}</b>
              </span>
              {POSITION_OPTIONS.map((pos) => {
                const cap = TECHNIQUE_CAPS[t]?.[pos];
                return (
                  <label key={pos} role="cell" className={s.feeCell}>
                    <span className={s.feeInput}>
                      R$
                      <input
                        value={text[key(t, pos)]}
                        onChange={(e) => {
                          setSaved(false);
                          const v = e.target.value;
                          setText((x) => ({ ...x, [key(t, pos)]: v }));
                        }}
                        inputMode="decimal"
                        aria-label={`Preço de ${t} na ${positionFees[pos].label.toLowerCase()}`}
                      />
                    </span>
                    {cap && (
                      <small>
                        logo até {cap.w} × {cap.h} cm
                      </small>
                    )}
                  </label>
                );
              })}
            </div>
          ))}
        </div>
        <p className={s.hint}>
          Cada anúncio mostra no simulador só as técnicas marcadas nele (em Anúncios → Editar anúncio → Técnicas de personalização).
        </p>
        {error && <p className={m.error}>{error}</p>}
        <div className="button-row">
          <button type="button" className="button primary small" disabled={!enabled || pending || !dirty} onClick={save}>
            {pending ? "Salvando…" : "Salvar preços"}
          </button>
          {dirty && (
            <button type="button" className="button secondary small" disabled={pending} onClick={() => setText(initial)}>
              <RotateCcw size={14} /> Descartar
            </button>
          )}
          {saved && !dirty && <span className={s.hint}>Preços salvos. O simulador já mostra os valores novos.</span>}
        </div>
      </div>
    </div>
  );
}
