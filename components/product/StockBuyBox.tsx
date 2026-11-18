"use client";
// Compra online da linha pronta-entrega (a partir de 5 peças), dividida em duas partes do simulador:
// a aba "Pedido" (tamanhos, observações, frete) e o rodapé (valor por peça, total e o botão de compra),
// que fica sempre à vista nas duas abas. Cor, logos e técnica vêm da aba "Personalizar".
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Factory, Loader2, MapPin, MessageCircle, PackageCheck, ShoppingCart, Truck } from "lucide-react";
import { getColor, money, whatsappLink, type Product, type Size } from "@/lib/catalog";
import { CUSTOM_MIN_QTY } from "@/lib/quote";
import { lineFees, maxInstallments, PIX_DISCOUNT, unitPrice, type ShippingOption, volumeDiscount, volumeTiers } from "@/lib/pricing";
import { useStore } from "@/components/store/StoreProvider";
import { fetchShippingQuote } from "@/lib/shipping-client";
import { Stepper } from "@/components/ui/primitives";
import type { CustomProps } from "./ProductTop";
import { StickyBar } from "./StickyBar";
import s from "./Product.module.css";
import x from "./Simulator.module.css";

const maskCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};
const pieces = (n: number) => `${n} ${n === 1 ? "peça" : "peças"}`;

/**
 * Estado do pedido (tamanhos, observações) e as contas de preço. `onNeedSizes`: chamado quando
 * o cliente tenta comprar sem tamanhos (o simulador abre a aba "Pedido").
 */
export function useStockOrder(product: Product, custom: CustomProps, onNeedSizes: () => void) {
  const { addToCart } = useStore();
  const { color, positions, logos, placements, technique } = custom;
  const [sizes, setSizes] = useState<Partial<Record<Size, number>>>({});
  const [notes, setNotes] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const sizesRef = useRef<HTMLElement>(null);

  const qty = Object.values(sizes).reduce<number>((a, b) => a + (b || 0), 0);
  const t = technique ?? undefined;
  // personalização: preço de cada posição na técnica escolhida
  const baseUnit = product.price + lineFees({ slug: product.slug, positions, technique: t });
  const off = volumeDiscount(qty);
  const unit = unitPrice({ slug: product.slug, positions, sizes, technique: t });
  const total = Math.round(unit * qty * 100) / 100;
  // sem tamanhos ainda: o pedido mínimo, para o cliente ter uma referência
  const minTotal = Math.round(unitPrice({ slug: product.slug, positions, sizes: { M: product.minQty }, technique: t }) * product.minQty * 100) / 100;
  const minOk = qty >= product.minQty;

  const setSize = (size: Size, n: number) => {
    setSizes((cur) => ({ ...cur, [size]: n }));
    setSizeError(false);
  };

  const showSizes = () => {
    onNeedSizes();
    // espera a aba "Pedido" aparecer
    requestAnimationFrame(() => sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  function add(): boolean {
    if (!minOk) {
      // sem nenhuma peça ainda, só leva aos tamanhos; com algumas, avisa quantas faltam
      setSizeError(qty > 0);
      showSizes();
      return false;
    }
    const clean = Object.fromEntries(Object.entries(sizes).filter(([, n]) => (n ?? 0) > 0)) as Partial<Record<Size, number>>;
    return addToCart({
      slug: product.slug,
      color,
      sizes: clean,
      positions,
      logos: Object.fromEntries(
        positions.flatMap((p) => (logos[p] ? [[p, { name: logos[p]!.name, thumb: logos[p]!.thumb, ...(logos[p]!.url ? { url: logos[p]!.url } : {}) }]] : [])),
      ),
      placements: Object.fromEntries(positions.flatMap((p) => (placements[p] ? [[p, placements[p]!]] : []))),
      technique: positions.length && technique ? technique : undefined,
      notes: notes.trim() || undefined,
    });
  }

  return { sizes, setSize, notes, setNotes, sizeError, sizesRef, qty, baseUnit, off, unit, total, minTotal, minOk, add, showSizes };
}
export type StockOrder = ReturnType<typeof useStockOrder>;

/** Aba "Pedido": tamanhos e quantidades, condições de pagamento, observações e frete. */
export function StockOrderTab({ product, order, color, positions }: { product: Product; order: StockOrder } & Pick<CustomProps, "color" | "positions">) {
  const router = useRouter();
  const { cep: savedCep, setCep } = useStore();
  const { sizes, setSize, sizeError, sizesRef, qty, total, minOk } = order;
  const [cepInput, setCepInput] = useState("");
  const [shipping, setShipping] = useState<{ options: ShippingOption[]; error?: string; qty: number } | null>(null);
  const [loadingShip, setLoadingShip] = useState(false);
  const pix = Math.round(total * (1 - PIX_DISCOUNT) * 100) / 100;
  const installments = maxInstallments(total);
  const nextTier = [...volumeTiers].reverse().find((t) => qty < t.min);
  const colorName = getColor(color)?.name ?? "";

  useEffect(() => {
    if (savedCep && !cepInput) setCepInput(maskCep(savedCep));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedCep]);

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
    <div className={x.tabBody}>
      <section className={x.group} aria-labelledby="st-sizes" ref={sizesRef}>
        <h3 id="st-sizes" className={x.groupTitle}>
          Tamanhos e quantidades <span>{pieces(qty)}</span>
        </h3>
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
        {nextTier && qty > 0 && (
          <p className={s.tierHint}>
            Faltam {pieces(nextTier.min - qty)} para {Math.round(nextTier.off * 100)}% de desconto.
          </p>
        )}
        {qty >= CUSTOM_MIN_QTY && (
          <div className={s.factoryNudge}>
            <Factory size={18} />
            <div>
              <b>{qty} peças: você tem condições de fábrica</b>
              <p>Acima de {CUSTOM_MIN_QTY} peças um consultor faz o orçamento com preço de volume e pode personalizar tecido, gola e cores. Ou siga comprando por aqui.</p>
              <a
                href={whatsappLink(`Olá! Quero ${qty} peças de ${product.name} (${colorName.toLowerCase()}). Podem me passar as condições de fábrica?`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
              >
                <MessageCircle size={15} /> Falar com um consultor
              </a>
            </div>
          </div>
        )}
      </section>

      {total > 0 && (
        <div className={x.payBox}>
          <span>
            {money(pix)} no Pix ou {installments}x de {money(Math.round((total / installments) * 100) / 100)} sem juros
          </span>
          <button type="button" className="btn btn-outline btn-block" onClick={() => order.add() && router.push("/checkout")}>
            Comprar agora
          </button>
        </div>
      )}

      <details className={s.notesBox}>
        <summary>Adicionar observações</summary>
        <textarea
          className="input"
          rows={3}
          maxLength={1000}
          value={order.notes}
          onChange={(e) => order.setNotes(e.target.value)}
          placeholder="Ex.: logo em branco nas peças escuras; bordado no peito esquerdo."
          aria-label="Observações"
        />
      </details>

      <section className={s.ship} aria-labelledby="st-ship">
        <h3 id="st-ship" className={s.shipTitle}>
          <Truck size={17} /> Frete e prazo
        </h3>
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

      <p className={s.guarantee}>
        <PackageCheck size={16} /> Enviamos o layout para você aprovar antes de produzir.
      </p>
      <p className={s.crossSell}>
        Pedido para empresa, acima de 30 peças ou com vários modelos? <Link href="/orcamento">Monte seu pedido e peça um orçamento</Link>
      </p>
    </div>
  );
}

/** Rodapé do simulador: valor por peça, total e "Adicionar ao carrinho" (no celular, também numa barra fixa). */
export function StockOrderFooter({ product, order, positions }: { product: Product; order: StockOrder } & Pick<CustomProps, "positions">) {
  const { openDrawer } = useStore();
  const { qty, unit, baseUnit, off, total, minTotal } = order;
  const ref = useRef<HTMLDivElement>(null);
  const buy = () => order.add() && openDrawer("cart");
  return (
    <div className={x.footer} ref={ref}>
      <p className="sr-only" aria-live="polite">{qty > 0 ? `Total de ${money(total)} para ${pieces(qty)}, ${money(unit)} por peça.` : ""}</p>
      <dl className={x.sums}>
        <div>
          <dt>Valor por peça{positions.length ? " com logo" : ""}</dt>
          <dd>
            {off > 0 && <del>{money(baseUnit)}</del>} {money(unit)}
          </dd>
        </div>
        <div>
          <dt>{qty > 0 ? `Total (${pieces(qty)})` : `Mínimo (${pieces(product.minQty)})`}</dt>
          <dd>{money(qty > 0 ? total : minTotal)}</dd>
        </div>
      </dl>
      <button type="button" className={x.buyBtn} onClick={buy}>
        <ShoppingCart size={19} /> Adicionar ao carrinho
      </button>

      <StickyBar watch={ref}>
        <div className={s.stickyInfo}>
          <small>{qty > 0 ? `${pieces(qty)} · ${money(unit)}/un.` : "Valor por peça"}</small>
          <strong>{money(qty > 0 ? total : unit)}</strong>
        </div>
        <button type="button" className="btn btn-primary" onClick={qty > 0 ? buy : order.showSizes}>
          <ShoppingCart size={17} /> {qty > 0 ? "Adicionar" : "Escolher tamanhos"}
        </button>
      </StickyBar>
    </div>
  );
}
