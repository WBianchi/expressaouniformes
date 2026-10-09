"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgePercent,
  CheckCircle2,
  CreditCard,
  Factory,
  Loader2,
  MapPin,
  PackageCheck,
  PenTool,
  QrCode,
  ShoppingCart,
  Truck,
  Upload,
  Zap,
} from "lucide-react";
import { getColor, money, positionFees, type Position, type Product, type Size } from "@/lib/catalog";
import {
  maxInstallments,
  PIX_DISCOUNT,
  quoteShipping,
  unitPrice,
  volumeDiscount,
  volumeTiers,
} from "@/lib/pricing";
import { useStore } from "@/components/store/StoreProvider";
import { Price, Stepper, Swatches } from "@/components/ui/primitives";
import { LogoUpload, type LogoValue } from "./LogoUpload";
import { PositionPicker } from "./PositionPicker";
import { ProductHead } from "./ProductHead";
import { StickyBar } from "./StickyBar";
import { AnimatedNumber } from "./motion";
import s from "./Product.module.css";

const maskCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

export function StockBuyBox({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart, openDrawer, cep: savedCep, setCep } = useStore();
  const [color, setColor] = useState(product.colors[0]);
  const [sizes, setSizes] = useState<Partial<Record<Size, number>>>({});
  const [positions, setPositions] = useState<Position[]>(["frente"]);
  const [logo, setLogo] = useState<LogoValue>(null);
  const [notes, setNotes] = useState("");
  const [cepInput, setCepInput] = useState("");
  const [quotedCep, setQuotedCep] = useState("");
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
  const minPct = Math.min(100, (qty / product.minQty) * 100);
  const colorName = getColor(color)?.name ?? "";

  const shipping = useMemo(
    () => (quotedCep ? quoteShipping(quotedCep, total, Math.max(qty, product.minQty)) : null),
    [quotedCep, total, qty, product.minQty],
  );

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

  const addAndOpen = () => {
    if (add()) openDrawer("cart");
  };
  const buyNow = () => {
    if (add()) router.push("/checkout");
  };

  function calcShipping() {
    const digits = cepInput.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLoadingShip(true);
    setCep(digits);
    window.setTimeout(() => {
      setQuotedCep(digits);
      setLoadingShip(false);
    }, 350);
  }

  return (
    <div className={s.buy}>
      <ProductHead product={product} />

      <div className={s.priceBlock}>
        <Price value={product.price} compareAt={product.compareAt} prefix="A partir de (peça lisa)" size="lg" />
        <div className={s.priceNotes}>
          <span className="chip chip-success"><Zap size={12} fill="currentColor" /> {product.stock?.toLocaleString("pt-BR")} peças em estoque</span>
          <span className={s.muted}>ou {money(product.price * (1 - PIX_DISCOUNT))} no Pix</span>
        </div>
      </div>

      {/* 1. Cor */}
      <section className={s.step} aria-labelledby="st-color">
        <h2 id="st-color" className={s.stepTitle}>
          <span className={s.stepNum}>1</span> Cor <span className={s.stepValue}>{colorName}</span>
        </h2>
        <Swatches ids={product.colors} value={color} onChange={setColor} size="lg" />
      </section>

      {/* 2. Grade de tamanhos */}
      <section className={s.step} aria-labelledby="st-sizes" ref={sizesRef}>
        <h2 id="st-sizes" className={s.stepTitle}>
          <span className={s.stepNum}>2</span> Grade de tamanhos
          <span className={s.stepValue}>{qty} {qty === 1 ? "peça" : "peças"}</span>
        </h2>
        <div className={s.sizeGrid} data-error={sizeError || undefined}>
          {product.sizes.map((z) => (
            <div key={z} className={s.sizeCell} data-filled={(sizes[z] ?? 0) > 0 || undefined}>
              <span className={s.sizeLabel}>{z}</span>
              <Stepper size="sm" value={sizes[z] ?? 0} onChange={(n) => setSize(z, n)} max={9999} label={`tamanho ${z}`} />
            </div>
          ))}
        </div>
        <div className={s.minBox} data-ok={minOk || undefined} data-error={sizeError || undefined}>
          <div className={s.minRow}>
            {minOk ? (
              <span><CheckCircle2 size={15} /> Pedido mínimo atingido</span>
            ) : (
              <span role={sizeError ? "alert" : undefined}>
                Pedido mínimo de <b>{product.minQty} peças</b> (pode misturar tamanhos)
                {qty > 0 && <> · faltam {product.minQty - qty}</>}
              </span>
            )}
            {qty > 0 && (
              <button type="button" className={s.linkBtn} onClick={() => setSizes({})}>Zerar</button>
            )}
          </div>
          <div className={s.bar} role="progressbar" aria-valuemin={0} aria-valuemax={product.minQty} aria-valuenow={Math.min(qty, product.minQty)} aria-label="Progresso do pedido mínimo">
            <span style={{ width: `${minPct}%` }} />
          </div>
        </div>
      </section>

      {/* 3. Posições */}
      <section className={s.step} aria-labelledby="st-pos">
        <h2 id="st-pos" className={s.stepTitle}>
          <span className={s.stepNum}>3</span> Posições da logo
          <span className={s.stepValue}>{positions.length ? `+ ${money(fees)}/peça` : "Peça lisa"}</span>
        </h2>
        <PositionPicker value={positions} onChange={setPositions} />
        {!positions.length && <p className={s.note}>Sem posição selecionada, as peças serão enviadas lisas, sem personalização.</p>}
      </section>

      {/* 4. Logo */}
      <section className={s.step} aria-labelledby="st-logo">
        <h2 id="st-logo" className={s.stepTitle}>
          <span className={s.stepNum}>4</span> Sua logo <span className={s.stepValue}>{logo ? "Anexada" : "Opcional agora"}</span>
        </h2>
        <LogoUpload value={logo} onChange={setLogo} />
        <label className={s.notes}>
          <span>Observações <small>(cores da logo, nomes, ajustes)</small></span>
          <textarea
            className="input"
            rows={3}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex.: logo em branco nas peças escuras; bordado no peito esquerdo."
          />
        </label>
      </section>

      {/* Calculadora */}
      <section className={s.calc} aria-labelledby="st-calc">
        <h2 id="st-calc" className="sr-only">Resumo do preço</h2>
        <p className="sr-only" aria-live="polite">{qty > 0 ? `Total de ${money(total)} para ${qty} peças, ${money(unit)} por peça.` : ""}</p>
        <dl className={s.calcRows}>
          <div><dt>Peça ({colorName.toLowerCase()})</dt><dd>{money(product.price)}</dd></div>
          {positions.map((p) => (
            <div key={p}><dt>Personalização — {positionFees[p].label.toLowerCase()}</dt><dd>+ {money(positionFees[p].fee)}</dd></div>
          ))}
          {off > 0 && (
            <div className={s.calcOff}><dt>Desconto progressivo</dt><dd>− {Math.round(off * 100)}%</dd></div>
          )}
          <div className={s.calcUnit}>
            <dt>Valor por peça</dt>
            <dd>
              {off > 0 && <del>{money(baseUnit)}</del>} <b><AnimatedNumber value={unit} /></b>
            </dd>
          </div>
        </dl>

        <div className={s.tiers}>
          {[...volumeTiers].reverse().map((t) => (
            <span key={t.min} className={s.tier} data-active={qty >= t.min || undefined}>
              <b>{Math.round(t.off * 100)}% off</b>
              <small>{t.label}</small>
            </span>
          ))}
        </div>
        {nextTier && (
          <p className={s.tierHint}>
            <BadgePercent size={15} />
            {qty === 0 ? (
              <>Compre {nextTier.min}+ peças e ganhe <b>{Math.round(nextTier.off * 100)}% off</b> por peça.</>
            ) : (
              <>Faltam <b>{nextTier.min - qty} {nextTier.min - qty === 1 ? "peça" : "peças"}</b> para {Math.round(nextTier.off * 100)}% off.</>
            )}
          </p>
        )}

        <div className={s.calcTotal}>
          <div>
            <small>Total ({qty} {qty === 1 ? "peça" : "peças"})</small>
            <strong><AnimatedNumber value={total} /></strong>
          </div>
          {total > 0 ? (
            <div className={s.payInfo}>
              <span><QrCode size={14} /> <AnimatedNumber value={pix} /> no Pix (−5%)</span>
              <span><CreditCard size={14} /> {installments}x de <AnimatedNumber value={Math.round((total / installments) * 100) / 100} /> sem juros</span>
            </div>
          ) : (
            <div className={s.payInfo}><small className={s.muted}>Informe a grade de tamanhos</small></div>
          )}
        </div>

        <div className={s.actions} ref={actionsRef}>
          <button type="button" className="btn btn-accent btn-lg btn-block" onClick={addAndOpen}>
            <ShoppingCart size={18} /> Adicionar ao carrinho
          </button>
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={buyNow}>
            Comprar agora
          </button>
        </div>
        {!logo && positions.length > 0 && (
          <p className={s.noteSmall}>Ainda sem a logo? Você pode comprar agora e enviá-la depois — só produzimos após a sua aprovação do layout.</p>
        )}
      </section>

      {/* Frete */}
      <section className={s.ship} aria-labelledby="st-ship">
        <h2 id="st-ship" className={s.shipTitle}><Truck size={17} /> Calcular frete e prazo</h2>
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
          <a className={s.linkBtn} href="https://buscacepinter.correios.com.br/" target="_blank" rel="noopener noreferrer">Não sei meu CEP</a>
        </form>
        {shipping && (
          <ul className={s.shipList}>
            {shipping.map((o) => (
              <li key={o.id}>
                <span><b>{o.label}</b><small>{o.days}</small></span>
                <b>{o.price === 0 ? "Grátis" : money(o.price)}</b>
              </li>
            ))}
            <li className={s.shipNote}>Estimativa para {Math.max(qty, product.minQty)} peças. O prazo de entrega começa após a aprovação do layout e a produção.</li>
          </ul>
        )}
      </section>

      {/* Fluxo */}
      <section className={s.flow} aria-labelledby="st-flow">
        <h2 id="st-flow" className={s.shipTitle}>Como funciona</h2>
        <ol className={s.flowList}>
          <li><span><Upload size={17} /></span><b>Você envia a logo</b><small>no pedido ou depois</small></li>
          <li><span><PenTool size={17} /></span><b>Enviamos o layout</b><small>para sua conferência</small></li>
          <li><span><CheckCircle2 size={17} /></span><b>Você aprova no site</b><small>em Minha conta › Pedidos</small></li>
          <li><span><Factory size={17} /></span><b>Produzimos e enviamos</b><small>para todo o Brasil</small></li>
        </ol>
        <p className={s.guarantee}><PackageCheck size={16} /> Nada é produzido sem a sua aprovação.</p>
      </section>

      <StickyBar watch={actionsRef}>
        <div className={s.stickyInfo}>
          <small>{qty > 0 ? `${qty} ${qty === 1 ? "peça" : "peças"} · ${money(unit)}/un.` : "A partir de"}</small>
          <strong><AnimatedNumber value={qty > 0 ? total : product.price} /></strong>
        </div>
        <button type="button" className="btn btn-accent" onClick={qty > 0 ? addAndOpen : () => sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}>
          <ShoppingCart size={17} /> {qty > 0 ? "Adicionar" : "Escolher tamanhos"}
        </button>
      </StickyBar>
    </div>
  );
}
