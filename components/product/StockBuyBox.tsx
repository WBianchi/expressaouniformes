"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, MapPin, PackageCheck, ShoppingCart, Truck } from "lucide-react";
import { getColor, money, positionFees, type Product, type Size } from "@/lib/catalog";
import { maxInstallments, PIX_DISCOUNT, unitPrice, type ShippingOption, volumeDiscount, volumeTiers } from "@/lib/pricing";
import { useStore } from "@/components/store/StoreProvider";
import { fetchShippingQuote } from "@/lib/shipping-client";
import { Price, Stepper, Swatches } from "@/components/ui/primitives";
import { Personalize, type PersonalizeProps } from "./Personalize";
import { ProductHead } from "./ProductHead";
import { StickyBar } from "./StickyBar";
import s from "./Product.module.css";

const maskCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

/** Compra online da linha pronta-entrega (a partir de 5 peças). */
export function StockBuyBox({ product, positions, onPositions, logo, onLogo }: PersonalizeProps & { product: Product }) {
  const router = useRouter();
  const { addToCart, openDrawer, cep: savedCep, setCep } = useStore();
  const [color, setColor] = useState(product.colors[0]);
  const [sizes, setSizes] = useState<Partial<Record<Size, number>>>({});
  const [notes, setNotes] = useState("");
  const [cepInput, setCepInput] = useState("");
  const [shipping, setShipping] = useState<{ options: ShippingOption[]; error?: string; qty: number } | null>(null);
  const [loadingShip, setLoadingShip] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const sizesRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (savedCep && !cepInput) setCepInput(maskCep(savedCep));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedCep]);

  const qty = Object.values(sizes).reduce<number>((a, b) => a + (b || 0), 0);
  const fees = positions.reduce((t, p) => t + positionFees[p].fee, 0);
  const baseUnit = product.price + fees;
  const off = volumeDiscount(qty);
  const unit = unitPrice({ slug: product.slug, positions, sizes });
  const total = Math.round(unit * qty * 100) / 100;
  const pix = Math.round(total * (1 - PIX_DISCOUNT) * 100) / 100;
  const installments = maxInstallments(total);
  const nextTier = [...volumeTiers].reverse().find((t) => qty < t.min);
  const minOk = qty >= product.minQty;
  const colorName = getColor(color)?.name ?? "";

  const setSize = (size: Size, n: number) => {
    setSizes((cur) => ({ ...cur, [size]: n }));
    setSizeError(false);
  };

  function add(): boolean {
    if (!minOk) {
      setSizeError(true);
      sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    const clean = Object.fromEntries(Object.entries(sizes).filter(([, n]) => (n ?? 0) > 0)) as Partial<Record<Size, number>>;
    return addToCart({
      slug: product.slug,
      color,
      sizes: clean,
      positions,
      logo: logo ? { name: logo.name, thumb: logo.thumb } : undefined,
      notes: notes.trim() || undefined,
    });
  }

  async function calcShipping() {
    const digits = cepInput.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLoadingShip(true);
    setCep(digits);
    // abaixo do mínimo, cota o pedido mínimo para dar uma referência real
    const quoteSizes = minOk ? sizes : ({ M: product.minQty } as Partial<Record<Size, number>>);
    const quotedQty = minOk ? qty : product.minQty;
    try {
      const r = await fetchShippingQuote(digits, [{ id: "estimativa", slug: product.slug, color, sizes: quoteSizes, positions }]);
      setShipping({ ...r, qty: quotedQty });
    } catch {
      setShipping({ options: [], error: "Não foi possível calcular o frete. Verifique sua conexão.", qty: quotedQty });
    } finally {
      setLoadingShip(false);
    }
  }

  return (
    <div className={s.buy}>
      <ProductHead product={product} />

      <div className={s.priceBlock}>
        <Price value={product.price} compareAt={product.compareAt} prefix="Peça lisa a partir de" size="lg" />
        <span className={s.muted}>ou {money(product.price * (1 - PIX_DISCOUNT))} no Pix · pedido mínimo de {product.minQty} peças</span>
      </div>

      <section className={s.step} aria-labelledby="st-color">
        <h2 id="st-color" className={s.stepTitle}>
          <span className={s.stepNum}>1</span> Cor <span className={s.stepValue}>{colorName}</span>
        </h2>
        <Swatches ids={product.colors} value={color} onChange={setColor} size="lg" />
      </section>

      <section className={s.step} aria-labelledby="st-sizes" ref={sizesRef}>
        <h2 id="st-sizes" className={s.stepTitle}>
          <span className={s.stepNum}>2</span> Tamanhos e quantidades
          <span className={s.stepValue}>
            {qty} {qty === 1 ? "peça" : "peças"}
          </span>
        </h2>
        <div className={s.sizeGrid} data-error={sizeError || undefined}>
          {product.sizes.map((z) => (
            <div key={z} className={s.sizeCell} data-filled={(sizes[z] ?? 0) > 0 || undefined}>
              <span className={s.sizeLabel}>{z}</span>
              <Stepper size="sm" value={sizes[z] ?? 0} onChange={(n) => setSize(z, n)} max={9999} label={`tamanho ${z}`} />
            </div>
          ))}
        </div>
        <p className={s.minLine} data-ok={minOk || undefined} data-error={sizeError || undefined} role={sizeError ? "alert" : undefined}>
          {minOk ? (
            <>
              <CheckCircle2 size={15} /> Pedido mínimo atingido
            </>
          ) : (
            <>
              Mínimo de {product.minQty} peças, pode misturar tamanhos{qty > 0 && <> · faltam {product.minQty - qty}</>}
            </>
          )}
        </p>
      </section>

      <Personalize product={product} positions={positions} onPositions={onPositions} logo={logo} onLogo={onLogo} fees step={3} />

      <details className={s.notesBox}>
        <summary>Adicionar observações</summary>
        <textarea
          className="input"
          rows={3}
          maxLength={1000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex.: logo em branco nas peças escuras; bordado no peito esquerdo."
          aria-label="Observações"
        />
      </details>

      <section className={s.calc} aria-labelledby="st-calc">
        <h2 id="st-calc" className="sr-only">Resumo do preço</h2>
        <p className="sr-only" aria-live="polite">{qty > 0 ? `Total de ${money(total)} para ${qty} peças, ${money(unit)} por peça.` : ""}</p>
        <dl className={s.calcRows}>
          <div>
            <dt>Valor por peça{positions.length ? " com logo" : ""}</dt>
            <dd>
              {off > 0 && <del>{money(baseUnit)}</del>} <b>{money(unit)}</b>
            </dd>
          </div>
          {off > 0 && (
            <div className={s.calcOff}>
              <dt>Desconto por quantidade</dt>
              <dd>−{Math.round(off * 100)}%</dd>
            </div>
          )}
        </dl>
        <div className={s.calcTotal}>
          <small>
            Total ({qty} {qty === 1 ? "peça" : "peças"})
          </small>
          <strong>{money(total)}</strong>
          {total > 0 && (
            <span className={s.payInfo}>
              {money(pix)} no Pix ou {installments}x de {money(Math.round((total / installments) * 100) / 100)} sem juros
            </span>
          )}
        </div>
        {nextTier && qty > 0 && (
          <p className={s.tierHint}>
            Faltam {nextTier.min - qty} {nextTier.min - qty === 1 ? "peça" : "peças"} para {Math.round(nextTier.off * 100)}% de desconto.
          </p>
        )}

        <div className={s.actions} ref={actionsRef}>
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => add() && openDrawer("cart")}>
            <ShoppingCart size={18} /> Adicionar ao carrinho
          </button>
          <button type="button" className="btn btn-outline btn-lg btn-block" onClick={() => add() && router.push("/checkout")}>
            Comprar agora
          </button>
        </div>
        <p className={s.guarantee}>
          <PackageCheck size={16} /> Enviamos o layout para você aprovar antes de produzir.
        </p>
      </section>

      <section className={s.ship} aria-labelledby="st-ship">
        <h2 id="st-ship" className={s.shipTitle}>
          <Truck size={17} /> Frete e prazo
        </h2>
        <form
          className={s.shipForm}
          onSubmit={(e) => {
            e.preventDefault();
            calcShipping();
          }}
        >
          <label className="sr-only" htmlFor="cep-prod">CEP</label>
          <span className={s.cepField}>
            <MapPin size={16} aria-hidden />
            <input id="cep-prod" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={cepInput} onChange={(e) => setCepInput(maskCep(e.target.value))} />
          </span>
          <button type="submit" className="btn btn-outline btn-sm" disabled={cepInput.replace(/\D/g, "").length !== 8 || loadingShip}>
            {loadingShip ? <Loader2 size={15} className={s.spin} /> : "Calcular"}
          </button>
        </form>
        {shipping?.error && (
          <ul className={s.shipList}>
            <li className={s.shipNote} role="alert">{shipping.error}</li>
          </ul>
        )}
        {shipping && shipping.options.length > 0 && (
          <ul className={s.shipList}>
            {shipping.options.map((o) => (
              <li key={o.id}>
                <span>
                  <b>{o.label}</b>
                  <small>{o.days}</small>
                </span>
                <b>{o.price === 0 ? "Grátis" : money(o.price)}</b>
              </li>
            ))}
            <li className={s.shipNote}>Cotação para {shipping.qty} peças. O prazo conta a partir da aprovação do layout.</li>
          </ul>
        )}
      </section>

      <p className={s.crossSell}>
        Pedido para empresa, acima de 30 peças ou com vários modelos? <Link href="/orcamento">Monte seu pedido e peça um orçamento</Link>
      </p>

      <StickyBar watch={actionsRef}>
        <div className={s.stickyInfo}>
          <small>{qty > 0 ? `${qty} ${qty === 1 ? "peça" : "peças"} · ${money(unit)}/un.` : "A partir de"}</small>
          <strong>{money(qty > 0 ? total : product.price)}</strong>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={qty > 0 ? () => add() && openDrawer("cart") : () => sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
        >
          <ShoppingCart size={17} /> {qty > 0 ? "Adicionar" : "Escolher tamanhos"}
        </button>
      </StickyBar>
    </div>
  );
}
