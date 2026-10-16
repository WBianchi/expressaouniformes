"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BadgePercent, CreditCard, Lock, MapPin, QrCode, ShieldCheck, Tag, Truck, X } from "lucide-react";
import { money } from "@/lib/catalog";
import { FREE_SHIPPING_FROM, PIX_DISCOUNT, coupons, maxInstallments } from "@/lib/pricing";
import { useStore } from "@/components/store/StoreProvider";
import { maskCep } from "@/components/checkout/masks";
import { AnimatedMoney } from "./AnimatedMoney";
import s from "./Cart.module.css";

export function CartSummary() {
  const { summary, coupon, applyCoupon, removeCoupon, cep, setCep, shippingOptions, shippingLoading, shippingError, shipping, selectShipping } = useStore();
  const [code, setCode] = useState("");
  const [cepDraft, setCepDraft] = useState(cep);
  const missing = Math.max(0, FREE_SHIPPING_FROM - summary.subtotal);
  const progress = Math.min(100, (summary.subtotal / FREE_SHIPPING_FROM) * 100);
  const n = maxInstallments(summary.total);

  return (
    <aside className={s.summary} aria-labelledby="cart-summary-title">
      <h2 id="cart-summary-title" className={s.summaryTitle}>Resumo do pedido</h2>

      <div className={s.freeShip} data-done={missing === 0 || undefined}>
        <p>
          <Truck size={16} strokeWidth={1.75} />
          {missing > 0 ? (
            <>Faltam <b>{money(missing)}</b> para frete econômico grátis</>
          ) : (
            <>Você ganhou <b>frete econômico grátis</b></>
          )}
        </p>
        <div className={s.bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Progresso para frete grátis">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* cupom */}
      <div className={s.section}>
        <span className={s.sectionLabel}><Tag size={15} strokeWidth={1.75} /> Cupom de desconto</span>
        {coupon ? (
          <div className={s.couponApplied}>
            <BadgePercent size={18} />
            <div>
              <strong>{coupon.code}</strong>
              <span>{coupon.label}</span>
            </div>
            <button type="button" className="icon-btn" onClick={removeCoupon} aria-label="Remover cupom">
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <form
              className={s.inline}
              onSubmit={(e) => {
                e.preventDefault();
                if (code.trim() && applyCoupon(code)) setCode("");
              }}
            >
              <input className="input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Digite o código" aria-label="Código do cupom" maxLength={40} />
              <button className="btn btn-outline" type="submit" disabled={!code.trim()}>Aplicar</button>
            </form>
            <div className={s.couponChips} aria-label="Cupons disponíveis">
              {coupons.map((c) => {
                const locked = !!c.minSubtotal && summary.subtotal < c.minSubtotal;
                return (
                  <button key={c.code} type="button" className={s.couponChip} disabled={locked} onClick={() => applyCoupon(c.code)} title={c.label}>
                    <b>{c.code}</b>
                    <span>{locked ? `acima de ${money(c.minSubtotal!)}` : c.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* frete */}
      <div className={s.section}>
        <span className={s.sectionLabel}><MapPin size={15} strokeWidth={1.75} /> Calcular frete</span>
        <form
          className={s.inline}
          onSubmit={(e) => {
            e.preventDefault();
            setCep(cepDraft);
          }}
        >
          <input
            className="input"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            aria-label="CEP"
            value={cepDraft}
            onChange={(e) => {
              const v = maskCep(e.target.value);
              setCepDraft(v);
              if (v.length === 9) setCep(v);
            }}
          />
          <button className="btn btn-outline" type="submit">OK</button>
        </form>
        <a className={s.smallLink} href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer">
          Não sei meu CEP
        </a>
        {shippingLoading && <p className={s.smallLink} aria-live="polite">Calculando frete…</p>}
        {shippingError && <p className={s.smallLink} role="alert">{shippingError}</p>}
        {shippingOptions && (
          <div className={s.shipOptions} role="radiogroup" aria-label="Opções de frete">
            {shippingOptions.map((o) => (
              <label key={o.id} className={s.shipOption} data-active={shipping?.id === o.id || undefined}>
                <input type="radio" name="cart-ship" checked={shipping?.id === o.id} onChange={() => selectShipping(o.id)} />
                <span className={s.shipText}>
                  <b>{o.label}</b>
                  <small>{o.days}</small>
                </span>
                <strong>{o.price ? money(o.price) : "Grátis"}</strong>
              </label>
            ))}
          </div>
        )}
      </div>

      <dl className={s.totals}>
        <div><dt>Subtotal ({summary.items} peças)</dt><dd><AnimatedMoney value={summary.subtotal} /></dd></div>
        {summary.discount > 0 && (
          <div className={s.green}><dt>Desconto do cupom</dt><dd>− <AnimatedMoney value={summary.discount} /></dd></div>
        )}
        <div><dt>Frete</dt><dd>{shipping ? (summary.shipping ? <AnimatedMoney value={summary.shipping} /> : "Grátis") : "Informe o CEP"}</dd></div>
        <div className={s.total}><dt>Total</dt><dd><AnimatedMoney value={summary.total} /></dd></div>
      </dl>

      <div className={s.payHints}>
        <p><QrCode size={16} strokeWidth={1.75} /> <b><AnimatedMoney value={summary.pixTotal} /></b> no Pix <span className="chip chip-success">{Math.round(PIX_DISCOUNT * 100)}% off</span></p>
        <p><CreditCard size={16} strokeWidth={1.75} /> ou {n}x de <b>{money(summary.total / n)}</b> sem juros</p>
      </div>

      <Link href="/checkout" className="btn btn-accent btn-lg btn-block">
        Finalizar compra <ArrowRight size={18} />
      </Link>
      <Link href="/loja?tipo=stock" className="btn btn-ghost btn-block">Continuar comprando</Link>

      <ul className={s.seals}>
        <li><Lock size={14} /> Compra segura</li>
        <li><ShieldCheck size={14} /> Pagamento via Asaas</li>
        <li><BadgePercent size={14} /> Desconto por volume</li>
      </ul>
    </aside>
  );
}
