"use client";
import { useState } from "react";
import { ChevronDown, Lock, Palette, ShoppingBag } from "lucide-react";
import { getProduct, money } from "@/lib/catalog";
import { positionsLabel, type OrderQuote } from "@/lib/orders";
import type { CartLine } from "@/lib/pricing";
import { SafeImage } from "@/components/ui/primitives";
import { AnimatedMoney } from "@/components/cart/AnimatedMoney";
import s from "./Checkout.module.css";

type Totals = Pick<OrderQuote, "subtotal" | "discount" | "total" | "pixDiscount" | "chargeTotal" | "installments" | "installmentValue" | "items"> & {
  shipping: number | null;
  couponCode?: string;
  method: OrderQuote["method"];
};

/** Resumo sticky no desktop e colapsável no mobile. */
export function OrderSummary({ lines, totals }: { lines: CartLine[]; totals: Totals }) {
  const [open, setOpen] = useState(false);
  return (
    <aside className={s.summary} data-open={open || undefined} aria-labelledby="co-summary-title">
      <button type="button" className={s.summaryToggle} aria-expanded={open} aria-controls="co-summary-body" onClick={() => setOpen((o) => !o)}>
        <ShoppingBag size={18} strokeWidth={1.75} />
        <span>{open ? "Ocultar resumo" : "Ver resumo do pedido"}</span>
        <ChevronDown size={18} className={s.chev} />
        <strong><AnimatedMoney value={totals.chargeTotal} /></strong>
      </button>

      <div id="co-summary-body" className={s.summaryBody}>
        <h2 id="co-summary-title" className={s.summaryTitle}>Resumo do pedido</h2>
        <ul className={s.sumLines}>
          {lines.map((l, i) => {
            const p = getProduct(l.slug);
            if (!p) return null;
            const qty = Object.values(l.sizes).reduce<number>((a, b) => a + (b || 0), 0);
            return (
              <li key={l.id} style={{ animationDelay: `${i * 70}ms` }}>
                <span className={s.sumThumb}>
                  <SafeImage src={p.image} alt="" />
                  <b>{qty}</b>
                </span>
                <span className={s.sumText}>
                  <strong>{p.name}</strong>
                  <small>
                    {Object.entries(l.sizes).filter(([, n]) => n).map(([k, n]) => `${k}:${n}`).join(" · ")}
                  </small>
                  <small>{positionsLabel(l.positions)}</small>
                </span>
              </li>
            );
          })}
        </ul>

        <dl className={s.sumTotals}>
          <div><dt>Subtotal ({totals.items} peças)</dt><dd><AnimatedMoney value={totals.subtotal} /></dd></div>
          {totals.discount > 0 && (
            <div className={s.green}><dt>Cupom {totals.couponCode}</dt><dd>− {money(totals.discount)}</dd></div>
          )}
          <div><dt>Frete</dt><dd>{totals.shipping === null ? "—" : totals.shipping ? <AnimatedMoney value={totals.shipping} /> : "Grátis"}</dd></div>
          {totals.pixDiscount > 0 && (
            <div className={s.green}><dt>Desconto Pix (5%)</dt><dd>− <AnimatedMoney value={totals.pixDiscount} /></dd></div>
          )}
          <div className={s.sumTotal}>
            <dt>Total</dt>
            <dd>
              <AnimatedMoney value={totals.chargeTotal} />
              {totals.method === "cartao" && totals.installments > 1 && (
                <small>{totals.installments}x de {money(totals.installmentValue)} sem juros</small>
              )}
            </dd>
          </div>
        </dl>

        <p className={s.sumNote}>
          <Palette size={15} strokeWidth={1.75} /> Você aprova o layout da arte antes de produzirmos.
        </p>
        <p className={s.sumNote}>
          <Lock size={15} strokeWidth={1.75} /> Pagamento processado com segurança pelo Asaas.
        </p>
      </div>
    </aside>
  );
}
