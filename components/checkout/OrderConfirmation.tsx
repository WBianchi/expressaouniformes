"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Barcode,
  Check,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Factory,
  FileDown,
  FlaskConical,
  Palette,
  QrCode,
  SearchX,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { money } from "@/lib/catalog";
import { positionsLabel, type CheckoutResponse, type StoredOrder } from "@/lib/orders";
import { getProduct } from "@/lib/catalog";
import { SafeImage } from "@/components/ui/primitives";
import { readCompletedOrder, readStoredOrder, updateStoredOrderStatus } from "./orderStorage";
import { useOrderStatus } from "./useOrderStatus";
import s from "./Order.module.css";

type State = { kind: "loading" } | { kind: "full"; order: CheckoutResponse } | { kind: "basic"; order: StoredOrder } | { kind: "missing" };

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  } catch {
    toast.error("Não foi possível copiar. Selecione e copie manualmente.");
  }
}

/** Asaas envia "AAAA-MM-DD HH:mm:ss" no horário de Brasília. */
function parseAsaasDate(v?: string) {
  if (!v) return null;
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v) ? `${v.replace(" ", "T")}-03:00` : v;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [target]);
  if (!target) return null;
  const ms = Math.max(0, target.getTime() - now);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const sec = Math.floor((ms % 60_000) / 1000);
  return { expired: ms === 0, text: h > 47 ? `${Math.floor(h / 24)} dias` : `${h > 0 ? `${h}h ` : ""}${String(m).padStart(2, "0")}min ${String(sec).padStart(2, "0")}s` };
}

const methodLabel = { pix: "Pix", boleto: "Boleto bancário", cartao: "Cartão de crédito" } as const;

export function OrderConfirmation({ id }: { id: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const full = readCompletedOrder(id);
    if (full) return setState({ kind: "full", order: full });
    const basic = readStoredOrder(id);
    setState(basic ? { kind: "basic", order: basic } : { kind: "missing" });
  }, [id]);

  // acompanha o pagamento no Asaas e atualiza a tela quando o Pix/boleto/cartão é confirmado
  const isDemo = state.kind === "full" ? state.order.demo : state.kind === "basic" ? !!state.order.demo : true;
  const shownStatus = state.kind === "full" ? state.order.payment.status : state.kind === "basic" ? state.order.payment?.status : undefined;
  const live = useOrderStatus(id, !isDemo && shownStatus !== "pago");
  useEffect(() => {
    if (!live || live.paymentStatus === shownStatus) return;
    updateStoredOrderStatus(id, live);
    setState((st) =>
      st.kind === "full"
        ? { kind: "full", order: { ...st.order, status: live.status, payment: { ...st.order.payment, status: live.paymentStatus } } }
        : st.kind === "basic"
          ? { kind: "basic", order: { ...st.order, status: live.status, payment: { method: st.order.payment?.method ?? "", ...st.order.payment, status: live.paymentStatus } } }
          : st,
    );
    if (live.paymentStatus === "pago") toast.success("Pagamento confirmado! Seu pedido já entrou na fila de layout.");
  }, [live, shownStatus, id]);

  if (state.kind === "loading") {
    return (
      <div className={`container ${s.page}`} aria-busy="true">
        <div className={`skeleton ${s.skel}`} />
      </div>
    );
  }

  if (state.kind === "missing") {
    return (
      <div className={`container ${s.page}`}>
        <div className={s.missing}>
          <SearchX size={40} strokeWidth={1.5} />
          <h1>Não encontramos este pedido neste navegador</h1>
          <p>
            O pedido <b>{id}</b> pode ter sido feito em outro dispositivo. Confira seu e-mail ou acesse a área do cliente.
          </p>
          <div className={s.ctas}>
            <Link href="/conta" className="btn btn-primary">Minha conta</Link>
            <Link href="/loja" className="btn btn-ghost">Ir para a loja</Link>
          </div>
        </div>
      </div>
    );
  }

  if (state.kind === "basic") {
    const o = state.order;
    return (
      <div className={`container ${s.page}`}>
        <Hero id={o.id} paid={o.payment?.status === "pago"} demo={!!o.demo} method={o.payment?.method} />
        <div className={s.card}>
          <p className={s.muted}>Total: <b>{money(o.total)}</b></p>
          {o.payment?.invoiceUrl && (
            <a className="btn btn-outline" href={o.payment.invoiceUrl} target="_blank" rel="noopener noreferrer">
              Abrir fatura <ExternalLink size={15} />
            </a>
          )}
        </div>
        <NextSteps />
      </div>
    );
  }

  const o = state.order;
  const p = o.payment;
  const paid = p.status === "pago";

  return (
    <div className={`container ${s.page}`}>
      <Hero id={o.orderId} paid={paid} demo={o.demo} method={p.method} />

      <div className={s.layout}>
        <div className={s.main}>
          {o.demo && (
            <div className={s.demo} role="status">
              <FlaskConical size={18} />
              <p><b>Pedido de teste.</b> O checkout está em modo demonstração: nenhuma cobrança foi gerada.</p>
            </div>
          )}

          {!o.demo && p.method === "pix" && !paid && <PixBox order={o} />}
          {!o.demo && p.method === "boleto" && !paid && <BoletoBox order={o} />}
          {!o.demo && p.method === "cartao" && (
            <section className={s.card} aria-labelledby="pay-title">
              <h2 id="pay-title" className={s.cardTitle}><CreditCard size={20} /> Cartão de crédito</h2>
              <p className={s.statusLine} data-tone={paid ? "ok" : p.status === "recusado" ? "bad" : "wait"}>
                {paid ? "Pagamento aprovado" : p.status === "em análise" ? "Pagamento em análise pela operadora" : `Status: ${p.status}`}
              </p>
              <p className={s.muted}>
                {p.installments && p.installments > 1 ? `${p.installments}x de ${money(p.installmentValue ?? 0)} sem juros` : "À vista"} · {money(o.quote.chargeTotal)}
              </p>
            </section>
          )}
          {paid && p.method !== "cartao" && !o.demo && (
            <section className={s.card}>
              <p className={s.statusLine} data-tone="ok">Pagamento confirmado</p>
            </section>
          )}

          <NextSteps />
        </div>

        <aside className={s.side} aria-labelledby="items-title">
          <h2 id="items-title" className={s.cardTitle}>Itens do pedido</h2>
          <ul className={s.items}>
            {o.quote.lines.map((l, i) => (
              <li key={i} style={{ animationDelay: `${200 + i * 80}ms` }}>
                <span className={s.itemThumb}>
                  <SafeImage src={getProduct(l.slug)?.image ?? ""} alt="" />
                </span>
                <div>
                  <strong>{l.name}</strong>
                  <small>{l.colorName} · {l.qty} peças</small>
                  <small>{Object.entries(l.sizes).filter(([, n]) => n).map(([k, n]) => `${k}:${n}`).join(" · ")}</small>
                  <small>{positionsLabel(l.positions)}</small>
                </div>
                <span>{money(l.total)}</span>
              </li>
            ))}
          </ul>
          <dl className={s.totals}>
            <div><dt>Subtotal</dt><dd>{money(o.quote.subtotal)}</dd></div>
            {o.quote.discount > 0 && <div className={s.green}><dt>Cupom {o.quote.coupon?.code}</dt><dd>− {money(o.quote.discount)}</dd></div>}
            <div><dt>Frete · {o.quote.shipping.label}</dt><dd>{o.quote.shipping.price ? money(o.quote.shipping.price) : "Grátis"}</dd></div>
            {o.quote.pixDiscount > 0 && <div className={s.green}><dt>Desconto Pix</dt><dd>− {money(o.quote.pixDiscount)}</dd></div>}
            <div className={s.total}><dt>Total · {methodLabel[p.method]}</dt><dd>{money(o.quote.chargeTotal)}</dd></div>
          </dl>
          {p.invoiceUrl && (
            <a className="btn btn-outline btn-block" href={p.invoiceUrl} target="_blank" rel="noopener noreferrer">
              Ver fatura <ExternalLink size={15} />
            </a>
          )}
        </aside>
      </div>
    </div>
  );
}

function Hero({ id, paid, demo, method }: { id: string; paid: boolean; demo: boolean; method?: string }) {
  const title = demo
    ? "Pedido de teste concluído!"
    : paid
      ? "Pedido confirmado!"
      : method === "pix"
        ? "Falta pouco: pague com Pix"
        : method === "boleto"
          ? "Pedido recebido! Pague o boleto"
          : "Pedido recebido!";
  return (
    <header className={s.hero}>
      <Confetti />
      <div className={`${s.burst} pattern-dots`} aria-hidden>
        <svg viewBox="0 0 52 52" className={s.checkSvg}>
          <circle cx="26" cy="26" r="24" fill="none" />
          <path fill="none" d="M15 27l7 7 15-16" />
        </svg>
      </div>
      <h1>{title}</h1>
      <p className={s.orderId}>
        Pedido <b>{id}</b>
        <button type="button" className="icon-btn" onClick={() => copy(id, "Número do pedido")} aria-label="Copiar número do pedido">
          <Copy size={15} />
        </button>
      </p>
      <p className={s.muted}>Guardamos este pedido em <Link href="/conta">Minha conta › Pedidos</Link>.</p>
    </header>
  );
}

/** Confete leve, só CSS (some sozinho; desativado com prefers-reduced-motion). */
function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => {
    const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
    return {
      "--x": `${Math.round((r(1) - 0.5) * 900)}px`,
      "--y": `${Math.round(260 + r(2) * 320)}px`,
      "--r": `${Math.round(r(3) * 720 - 360)}deg`,
      "--d": `${Math.round(r(4) * 260)}ms`,
      "--s": `${(0.7 + r(5) * 0.7).toFixed(2)}`,
    } as React.CSSProperties;
  });
  return (
    <div className={s.confetti} aria-hidden>
      {pieces.map((style, i) => <span key={i} style={style} />)}
    </div>
  );
}

function PixBox({ order }: { order: CheckoutResponse }) {
  const pix = order.payment.pix;
  const countdown = useCountdown(parseAsaasDate(pix?.expirationDate));
  return (
    <section className={s.card} aria-labelledby="pix-title">
      <h2 id="pix-title" className={s.cardTitle}><QrCode size={20} /> Pague com Pix · {money(order.quote.chargeTotal)}</h2>
      {pix ? (
        <div className={s.pix}>
          <div className={s.qr}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:image/png;base64,${pix.encodedImage}`} alt="QR Code Pix para pagamento" width={220} height={220} />
          </div>
          <div className={s.pixInfo}>
            <ol className={s.howTo}>
              <li>Abra o app do seu banco e escolha <b>Pix › Ler QR Code</b>.</li>
              <li>Ou use o <b>Pix copia e cola</b> com o código abaixo.</li>
              <li>A confirmação é automática em poucos segundos.</li>
            </ol>
            <label className={s.copyField}>
              <span className="sr-only">Código Pix copia e cola</span>
              <input className="input" readOnly value={pix.payload} onFocus={(e) => e.target.select()} />
            </label>
            <button type="button" className="btn btn-accent btn-block" onClick={() => copy(pix.payload, "Código Pix")}>
              <Copy size={16} /> Copiar código Pix
            </button>
            {countdown && (
              <p className={s.countdown} data-expired={countdown.expired || undefined}>
                <Clock size={15} /> {countdown.expired ? "Código expirado — abra a fatura para gerar um novo." : <>Expira em <b>{countdown.text}</b></>}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className={s.muted}>Não conseguimos carregar o QR Code aqui. Use o link da fatura para pagar.</p>
      )}
      {order.payment.invoiceUrl && (
        <a className={s.link} href={order.payment.invoiceUrl} target="_blank" rel="noopener noreferrer">
          Abrir fatura no Asaas <ExternalLink size={14} />
        </a>
      )}
    </section>
  );
}

function BoletoBox({ order }: { order: CheckoutResponse }) {
  const b = order.payment.boleto;
  const due = b?.dueDate ? new Date(`${b.dueDate}T12:00:00-03:00`).toLocaleDateString("pt-BR") : null;
  return (
    <section className={s.card} aria-labelledby="bol-title">
      <h2 id="bol-title" className={s.cardTitle}><Barcode size={20} /> Boleto · {money(order.quote.chargeTotal)}</h2>
      {due && <p className={s.muted}>Vencimento: <b>{due}</b> · compensação em até 2 dias úteis.</p>}
      {b?.identificationField ? (
        <>
          <label className={s.copyField}>
            <span className={s.fieldLabel}>Linha digitável</span>
            <input className={`input ${s.mono}`} readOnly value={b.identificationField} onFocus={(e) => e.target.select()} />
          </label>
          <button type="button" className="btn btn-accent" onClick={() => copy(b.identificationField!, "Linha digitável")}>
            <Copy size={16} /> Copiar linha digitável
          </button>
        </>
      ) : (
        <p className={s.muted}>A linha digitável estará disponível no PDF do boleto.</p>
      )}
      <div className={s.ctas}>
        {b?.bankSlipUrl && (
          <a className="btn btn-outline" href={b.bankSlipUrl} target="_blank" rel="noopener noreferrer">
            <FileDown size={16} /> Baixar boleto (PDF)
          </a>
        )}
        {order.payment.invoiceUrl && (
          <a className="btn btn-ghost" href={order.payment.invoiceUrl} target="_blank" rel="noopener noreferrer">
            Ver fatura <ExternalLink size={15} />
          </a>
        )}
      </div>
    </section>
  );
}

function NextSteps() {
  const items = [
    { icon: ShieldCheck, title: "Confirmação do pagamento", text: "Você recebe a confirmação por e-mail assim que o pagamento for aprovado." },
    { icon: Palette, title: "Layout para aprovação", text: "Enviaremos o layout para aprovação em Minha conta. Nada é produzido sem o seu ok." },
    { icon: Factory, title: "Produção", text: "Com o layout aprovado, sua grade entra na fila de produção da nossa fábrica." },
    { icon: Truck, title: "Envio", text: "Despachamos para o endereço informado e você acompanha tudo pela sua conta." },
  ];
  return (
    <section className={s.card} aria-labelledby="next-title">
      <h2 id="next-title" className={s.cardTitle}>Próximos passos</h2>
      <ol className={s.timeline}>
        {items.map((it, i) => (
          <li key={it.title} style={{ animationDelay: `${300 + i * 120}ms` }}>
            <span className={s.tlIcon}><it.icon size={18} strokeWidth={1.75} /></span>
            <div>
              <strong>{it.title}</strong>
              <p>{it.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className={s.ctas}>
        <Link href="/conta" className="btn btn-primary">
          Acompanhar em Minha conta <ArrowRight size={16} />
        </Link>
        <Link href="/loja" className="btn btn-ghost">Continuar comprando</Link>
      </div>
      <p className={s.muted}><Check size={14} /> Dúvidas? Responda o e-mail de confirmação ou fale com a gente pelo WhatsApp.</p>
    </section>
  );
}
