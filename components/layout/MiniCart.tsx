"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Lock,
  Package,
  PencilLine,
  ShoppingBag,
  Sparkles,
  TicketPercent,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { getColor, getProduct, money, positionFees, type Size } from "@/lib/catalog";
import {
  type CartLine,
  FREE_SHIPPING_FROM,
  PIX_DISCOUNT,
  lineLogos,
  lineQuantity,
  lineTotal,
  maxInstallments,
  unitPrice,
  volumeDiscount,
} from "@/lib/pricing";
import { useStore } from "@/components/store/StoreProvider";
import { Drawer } from "@/components/ui/Drawer";
import { SafeImage, Stepper } from "@/components/ui/primitives";
import { maskCep } from "./hooks";
import s from "./MiniCart.module.css";

const SIZE_ORDER: Size[] = ["PP", "P", "M", "G", "GG", "XG", "XGG"];
const gradeSummary = (l: CartLine) =>
  SIZE_ORDER.filter((z) => (l.sizes[z] ?? 0) > 0)
    .map((z) => `${z} ${l.sizes[z]}`)
    .join(" · ");

function LineItem({ line, onNavigate }: { line: CartLine; onNavigate: () => void }) {
  const { updateLine, removeLine, restoreLine } = useStore();
  const [editing, setEditing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const p = getProduct(line.slug);
  if (!p) return null;
  const color = getColor(line.color);
  const qty = lineQuantity(line);
  const off = volumeDiscount(qty);

  const remove = () => {
    setLeaving(true);
    window.setTimeout(() => {
      removeLine(line.id);
      toast(`${p.name} removido`, {
        description: `${qty} peças · ${money(lineTotal(line))}`,
        action: { label: "Desfazer", onClick: () => restoreLine(line.id) },
      });
    }, 280);
  };

  const setSize = (size: Size, n: number) => {
    const sizes = { ...line.sizes };
    if (n > 0) sizes[size] = n;
    else delete sizes[size];
    updateLine(line.id, { sizes });
  };

  return (
    <li className={s.line} data-leaving={leaving || undefined}>
      <div className={s.lineInner}>
        <div className={s.lineRow}>
          <Link href={`/produto/${p.slug}`} className={s.thumb} onClick={onNavigate} aria-label={p.name}>
            <SafeImage src={p.image} alt="" />
            {(() => {
              const logo = Object.values(lineLogos(line))[0];
              return (
                logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={s.logoThumb} src={logo.thumb} alt={`Logo: ${logo.name}`} title={logo.name} />
                )
              );
            })()}
          </Link>
          <div className={s.lineInfo}>
            <div className={s.lineTop}>
              <Link href={`/produto/${p.slug}`} className={s.lineName} onClick={onNavigate}>
                {p.name}
              </Link>
              <button type="button" className={s.remove} aria-label={`Remover ${p.name}`} onClick={remove}>
                <Trash2 size={16} />
              </button>
            </div>
            <div className={s.lineMeta}>
              {color && (
                <span className={s.color}>
                  <i style={{ "--sw": color.hex } as React.CSSProperties} aria-hidden />
                  {color.name}
                </span>
              )}
              <span className={s.grade}>{gradeSummary(line)}</span>
            </div>
            <div className={s.positions}>
              {line.positions.length ? (
                line.positions.map((pos) => (
                  <span key={pos} className={s.pos}>
                    {positionFees[pos].label}
                  </span>
                ))
              ) : (
                <span className={s.pos} data-muted>Sem personalização</span>
              )}
              {off > 0 && <span className={`${s.pos} ${s.off}`}>−{Math.round(off * 100)}% volume</span>}
            </div>
            <div className={s.lineBottom}>
              <button type="button" className={s.edit} aria-expanded={editing} onClick={() => setEditing((v) => !v)}>
                <PencilLine size={14} /> {editing ? "Concluir" : "Editar grade"}
                <ChevronDown size={14} className={s.editChev} />
              </button>
              <div className={s.prices}>
                <small>{qty} × {money(unitPrice(line))}</small>
                <b>{money(lineTotal(line))}</b>
              </div>
            </div>
          </div>
        </div>
        <div className={s.editor} data-open={editing || undefined} inert={!editing}>
          <div>
            <div className={s.editorGrid}>
              {p.sizes.map((z) => (
                <div key={z} className={s.sizeCell} data-has={(line.sizes[z] ?? 0) > 0 || undefined}>
                  <span>{z}</span>
                  <Stepper size="sm" value={line.sizes[z] ?? 0} onChange={(n) => setSize(z, n)} label={`tamanho ${z}`} />
                </div>
              ))}
            </div>
            <p className={s.editorHint}>
              Mínimo de {p.minQty} peças por item · desconto progressivo a partir de 20 peças.
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}

function Collapsible({ icon, title, aside, children, defaultOpen = false }: { icon: React.ReactNode; title: string; aside?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={s.collapse} data-open={open || undefined}>
      <button type="button" className={s.collapseHead} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className={s.collapseIcon}>{icon}</span>
        <span className={s.collapseTitle}>{title}</span>
        {aside}
        <ChevronDown size={16} className={s.collapseChev} />
      </button>
      <div className={s.collapseBody} inert={!open}>
        <div>
          <div className={s.collapsePad}>{children}</div>
        </div>
      </div>
    </div>
  );
}

function CouponBox() {
  const { coupon, applyCoupon, removeCoupon } = useStore();
  const [code, setCode] = useState("");
  return (
    <Collapsible
      icon={<TicketPercent size={18} strokeWidth={1.75} />}
      title="Cupom de desconto"
      aside={coupon ? <span className="chip chip-success">{coupon.code}</span> : undefined}
    >
      {coupon ? (
        <div className={s.appliedCoupon}>
          <span className={s.couponChip}>
            <Check size={14} /> <b>{coupon.code}</b> · {coupon.label}
          </span>
          <button type="button" className={s.chipRemove} onClick={removeCoupon} aria-label={`Remover cupom ${coupon.code}`}>
            <X size={14} />
          </button>
        </div>
      ) : (
        <form
          className={s.inlineForm}
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim() && applyCoupon(code)) setCode("");
          }}
        >
          <input className="input" placeholder="Digite seu cupom" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} aria-label="Código do cupom" autoComplete="off" />
          <button type="submit" className="btn btn-primary" disabled={!code.trim()}>
            Aplicar
          </button>
        </form>
      )}
    </Collapsible>
  );
}

function ShippingBox() {
  const { cep, setCep, shippingOptions, shippingLoading, shippingError, shipping, selectShipping } = useStore();
  return (
    <Collapsible
      icon={<Truck size={18} strokeWidth={1.75} />}
      title="Calcular frete"
      aside={shipping && cep.replace(/\D/g, "").length === 8 ? <span className={s.asidePrice}>{shipping.price === 0 ? "Grátis" : money(shipping.price)}</span> : undefined}
    >
      <label className={s.cepRow}>
        <span className="sr-only">CEP</span>
        <input
          className="input"
          inputMode="numeric"
          placeholder="00000-000"
          value={cep}
          maxLength={9}
          onChange={(e) => setCep(maskCep(e.target.value))}
          autoComplete="postal-code"
        />
        <a href="https://buscacepinternet.correios.com.br/" target="_blank" rel="noopener noreferrer" className={s.cepHelp}>
          Não sei meu CEP
        </a>
      </label>
      {shippingLoading && <p className={s.shipNote} aria-live="polite">Calculando frete…</p>}
      {shippingError && <p className={s.shipNote} role="alert">{shippingError}</p>}
      {shippingOptions ? (
        <div className={s.shipList} role="radiogroup" aria-label="Opções de frete">
          {shippingOptions.map((o) => (
            <label key={o.id} className={s.shipOpt} data-active={shipping?.id === o.id || undefined}>
              <input type="radio" name="minicart-ship" checked={shipping?.id === o.id} onChange={() => selectShipping(o.id)} />
              <span className={s.radio} aria-hidden />
              <span className={s.shipText}>
                <b>{o.label}</b>
                <small>{o.days}</small>
              </span>
              <b className={s.shipPrice} data-free={o.price === 0 || undefined}>
                {o.price === 0 ? "Grátis" : money(o.price)}
              </b>
            </label>
          ))}
          <p className={s.shipNote}>Prazo de entrega contado após a aprovação do layout e produção.</p>
        </div>
      ) : (
        cep.replace(/\D/g, "").length > 0 && cep.replace(/\D/g, "").length < 8 && <p className={s.shipNote}>Digite os 8 números do CEP.</p>
      )}
    </Collapsible>
  );
}

/** Mini carrinho lateral. */
export function MiniCart() {
  const { ready, cart, drawer, closeDrawer, openDrawer, summary, shipping } = useStore();
  const open = drawer === "cart";
  const remaining = Math.max(0, FREE_SHIPPING_FROM - summary.subtotal);
  const progress = Math.min(100, (summary.subtotal / FREE_SHIPPING_FROM) * 100);
  const n = maxInstallments(summary.total);
  const empty = ready && cart.length === 0;

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => (o ? openDrawer("cart") : closeDrawer())}
      title="Seu carrinho"
      description={ready && cart.length ? `${summary.items} peças em ${cart.length} ${cart.length === 1 ? "item" : "itens"}` : "Revise seus itens antes de finalizar"}
      width={460}
      footer={
        ready && cart.length > 0 ? (
          <div className={s.foot}>
            <dl className={s.summary}>
              <div>
                <dt>Subtotal</dt>
                <dd>{money(summary.subtotal)}</dd>
              </div>
              {summary.discount > 0 && (
                <div className={s.discount}>
                  <dt>Desconto</dt>
                  <dd>−{money(summary.discount)}</dd>
                </div>
              )}
              <div>
                <dt>Frete</dt>
                <dd>{shipping ? (summary.shipping === 0 ? <span className={s.free}>Grátis</span> : money(summary.shipping)) : <span className={s.muted}>Calcule acima</span>}</dd>
              </div>
              <div className={s.total}>
                <dt>Total</dt>
                <dd>
                  <b>{money(summary.total)}</b>
                  <small>
                    ou <strong>{money(summary.pixTotal)}</strong> no Pix ({Math.round(PIX_DISCOUNT * 100)}% off)
                    {n > 1 && <> · até {n}x de {money(summary.total / n)} sem juros</>}
                  </small>
                </dd>
              </div>
            </dl>
            <Link href="/checkout" className="btn btn-accent btn-lg btn-block" onClick={closeDrawer}>
              <Lock size={17} /> Finalizar compra <ArrowRight size={18} />
            </Link>
            <Link href="/carrinho" className="btn btn-outline btn-block" onClick={closeDrawer}>
              Ver carrinho completo
            </Link>
          </div>
        ) : undefined
      }
    >
      {!ready ? (
        <div className={s.loading}>
          {[0, 1].map((i) => (
            <div key={i} className={s.skelRow}>
              <span className="skeleton" />
              <div>
                <span className="skeleton" />
                <span className="skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : empty ? (
        <div className={s.empty}>
          <div className={s.emptyArt} aria-hidden>
            <span className={s.emptyRing} />
            <ShoppingBag size={40} strokeWidth={1.4} />
          </div>
          <h3>Seu carrinho está vazio</h3>
          <p>Escolha um modelo pronto para personalizar com a sua logo ou monte um uniforme exclusivo para a sua empresa.</p>
          <div className={s.emptyCtas}>
            <Link href="/loja?tipo=stock" className="btn btn-primary btn-block" onClick={closeDrawer}>
              <Package size={18} /> Ver pronta-entrega <ArrowRight size={18} />
            </Link>
            <Link href="/orcamento" className="btn btn-outline btn-block" onClick={closeDrawer}>
              <Sparkles size={18} /> Orçamento para empresas
            </Link>
          </div>
        </div>
      ) : (
        <div className={s.body}>
          <div className={s.freeShip} data-done={remaining === 0 || undefined}>
            <p>
              <Truck size={16} />
              {remaining > 0 ? (
                <>
                  Faltam <b>{money(remaining)}</b> para o <b>frete grátis</b>
                </>
              ) : (
                <>
                  Parabéns! Você ganhou <b>frete grátis</b> no econômico
                </>
              )}
            </p>
            <div className={s.track} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Progresso para frete grátis">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <ul className={s.lines}>
            {cart.map((l) => (
              <LineItem key={l.id} line={l} onNavigate={closeDrawer} />
            ))}
          </ul>

          <div className={s.extras}>
            <CouponBox />
            <ShippingBox />
          </div>
        </div>
      )}
    </Drawer>
  );
}
