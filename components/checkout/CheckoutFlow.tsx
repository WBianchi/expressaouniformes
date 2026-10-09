"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Barcode,
  Building2,
  Check,
  CreditCard,
  FlaskConical,
  Loader2,
  Lock,
  MapPin,
  Pencil,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  User,
} from "lucide-react";
import { money } from "@/lib/catalog";
import { PIX_DISCOUNT, maxInstallments, totals as cartTotals } from "@/lib/pricing";
import {
  type CheckoutResponse,
  type PaymentMethod,
  cardSchema,
  checkoutAddressSchema,
  checkoutCustomerSchema,
  computeQuote,
  detectBrand,
  newOrderId,
} from "@/lib/orders";
import { useStore } from "@/components/store/StoreProvider";
import { CardPreview } from "./CardPreview";
import { OrderSummary } from "./OrderSummary";
import { maskCard, maskCep, maskCnpj, maskCpf, maskExpiry, maskPhone, onlyDigits } from "./masks";
import { saveCompletedOrder } from "./orderStorage";
import { AnimatedMoney } from "@/components/cart/AnimatedMoney";
import s from "./Checkout.module.css";

type Customer = { type: "pf" | "pj"; name: string; company: string; document: string; email: string; phone: string };
type Address = { cep: string; street: string; number: string; complement: string; district: string; city: string; state: string };
type Card = { holderName: string; number: string; expiry: string; ccv: string };
type Errors = Record<string, string>;

const steps = [
  { id: "id", label: "Identificação", icon: User },
  { id: "entrega", label: "Entrega", icon: MapPin },
  { id: "pagamento", label: "Pagamento", icon: CreditCard },
  { id: "revisao", label: "Revisão", icon: Check },
] as const;

const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

function issuesToErrors(issues: { path: PropertyKey[]; message: string }[]): Errors {
  const e: Errors = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? "_");
    if (!e[k]) e[k] = i.message;
  }
  return e;
}

const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}-key`);

export function CheckoutFlow() {
  const router = useRouter();
  const store = useStore();
  const { cart, ready, coupon, cep: storeCep, setCep, shippingOptions, shipping, selectShipping, clearCart } = store;

  const [step, setStep] = useState(0);
  const [customer, setCustomer] = useState<Customer>({ type: "pf", name: "", company: "", document: "", email: "", phone: "" });
  const [address, setAddress] = useState<Address>({ cep: "", street: "", number: "", complement: "", district: "", city: "", state: "" });
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [installments, setInstallments] = useState(1);
  const [card, setCard] = useState<Card>({ holderName: "", number: "", expiry: "", ccv: "" });
  const [flipped, setFlipped] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [cepState, setCepState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [mode, setMode] = useState<"demo" | "sandbox" | "production" | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const idemKey = useRef<string>("");
  const busy = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);
  const demo = mode === "demo";
  const prevStep = useRef(0);
  const dir = step >= prevStep.current ? "fwd" : "back";
  useEffect(() => {
    prevStep.current = step;
  }, [step]);

  // modo de pagamento (sem expor nada sensível)
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/checkout", { signal: ctrl.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setMode(d.mode === "production" || d.mode === "sandbox" ? d.mode : "demo"))
      .catch(() => setMode(null));
    return () => ctrl.abort();
  }, []);

  // pré-preenche com perfil salvo e CEP do carrinho
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("eu-profile") || "null");
      if (p && typeof p.email === "string")
        setCustomer((c) => ({
          ...c,
          type: p.type === "pj" ? "pj" : "pf",
          name: String(p.name ?? ""),
          email: String(p.email ?? ""),
          phone: maskPhone(String(p.phone ?? "")),
          company: String(p.company ?? ""),
        }));
    } catch {
      /* ignora */
    }
  }, []);
  useEffect(() => {
    if (ready && storeCep && !address.cep) lookupCep(storeCep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // ------------------------------------------------ valores (mesma regra do servidor)
  const quote = useMemo(() => {
    if (!cart.length || !shipping) return null;
    const r = computeQuote({
      lines: cart,
      coupon: coupon?.code,
      cep: storeCep,
      shippingId: shipping.id,
      method,
      installments: method === "cartao" ? installments : 1,
    });
    return r.ok ? r.quote : null;
  }, [cart, coupon, storeCep, shipping, method, installments]);

  const base = useMemo(() => cartTotals(cart, coupon, shipping), [cart, coupon, shipping]);
  const maxInst = maxInstallments(base.total);
  useEffect(() => {
    if (installments > maxInst) setInstallments(maxInst);
  }, [installments, maxInst]);

  const summaryTotals = quote
    ? { ...quote, shipping: quote.shipping.price, couponCode: quote.coupon?.code }
    : {
        subtotal: base.subtotal,
        discount: base.discount,
        total: base.total,
        items: base.items,
        pixDiscount: method === "pix" ? Math.round((base.total - base.pixTotal) * 100) / 100 : 0,
        chargeTotal: method === "pix" ? base.pixTotal : base.total,
        installments: method === "cartao" ? installments : 1,
        installmentValue: base.total / (method === "cartao" ? installments : 1),
        shipping: shipping ? base.shipping : null,
        couponCode: coupon?.code,
        method,
      };

  // ------------------------------------------------ CEP (ViaCEP no cliente)
  async function lookupCep(raw: string) {
    const masked = maskCep(raw);
    setAddress((a) => ({ ...a, cep: masked }));
    const d = onlyDigits(masked);
    if (d.length !== 8) {
      setCepState("idle");
      return;
    }
    setCep(masked);
    setCepState("loading");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${d}/json/`, { signal: AbortSignal.timeout(7000) });
      if (!res.ok) throw new Error("falha");
      const data = await res.json();
      if (data.erro) {
        setCepState("error");
        setErrors((e) => ({ ...e, cep: "CEP não encontrado. Confira ou preencha o endereço manualmente." }));
        return;
      }
      setAddress((a) => ({
        ...a,
        cep: masked,
        street: data.logradouro || a.street,
        district: data.bairro || a.district,
        city: data.localidade || a.city,
        state: data.uf || a.state,
      }));
      setErrors((e) => {
        const { cep: _c, street: _s, district: _d, city: _ci, state: _st, ...rest } = e;
        return rest;
      });
      setCepState("ok");
      window.setTimeout(() => numberRef.current?.focus(), 50);
    } catch {
      setCepState("error");
      setErrors((e) => ({ ...e, cep: "Não foi possível consultar o CEP agora. Preencha o endereço manualmente." }));
    }
  }

  // ------------------------------------------------ validação por etapa
  function validate(i: number): Errors {
    if (i === 0) {
      const r = checkoutCustomerSchema.safeParse({ ...customer, company: customer.company || undefined });
      return r.success ? {} : issuesToErrors(r.error.issues);
    }
    if (i === 1) {
      const r = checkoutAddressSchema.safeParse({ ...address, complement: address.complement || undefined });
      const e = r.success ? {} : issuesToErrors(r.error.issues);
      if (!shipping) e.shipping = "Escolha uma opção de entrega.";
      return e;
    }
    if (i === 2) {
      if (method !== "cartao" || demo) return {};
      const r = cardSchema.safeParse(card);
      const e = r.success ? {} : issuesToErrors(r.error.issues);
      if (installments > maxInst) e.installments = `Até ${maxInst}x`;
      return e;
    }
    return {};
  }

  function goTo(i: number) {
    for (let k = 0; k < i; k++) {
      const e = validate(k);
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(k);
        toast.error("Confira os campos destacados.");
        return;
      }
    }
    setErrors({});
    setStep(i);
  }

  /** revalida em tempo real apenas campos que já mostraram erro */
  function revalidate(i: number, key: string) {
    if (!errors[key]) return;
    window.setTimeout(() => {
      const e = validate(i);
      setErrors((prev) => {
        const next = { ...prev };
        if (e[key]) next[key] = e[key];
        else delete next[key];
        return next;
      });
    }, 0);
  }

  const brand = detectBrand(card.number);

  // ------------------------------------------------ envio
  async function submit() {
    if (busy.current) return;
    for (let k = 0; k < 3; k++) {
      const e = validate(k);
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(k);
        toast.error("Confira os campos destacados.");
        return;
      }
    }
    if (!accepted) {
      setErrors({ accepted: "Confirme que leu a política de privacidade." });
      return;
    }
    if (!shipping || !quote) {
      toast.error("Não foi possível calcular o total. Revise a entrega.");
      return;
    }
    busy.current = true;
    setSubmitting(true);
    setSubmitError(null);
    if (!idemKey.current) idemKey.current = newKey();

    const body = {
      idempotencyKey: idemKey.current,
      customer: { ...customer, company: customer.company || undefined },
      address: { ...address, complement: address.complement || undefined },
      lines: cart,
      coupon: coupon?.code ?? null,
      shippingId: shipping.id,
      payment: {
        method,
        installments: method === "cartao" ? installments : 1,
        card: method === "cartao" && !demo ? { ...card, number: onlyDigits(card.number) } : undefined,
      },
      expectedTotal: quote.chargeTotal,
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return finish(data as CheckoutResponse);
      if (res.status === 503 && data.demo && data.quote) {
        return finish({
          orderId: newOrderId(),
          demo: true,
          createdAt: new Date().toISOString(),
          status: "pago",
          quote: data.quote,
          payment: { id: null, method, status: "pago", installments: data.quote.installments, installmentValue: data.quote.installmentValue },
        });
      }
      idemKey.current = ""; // nova tentativa = nova chave
      if (res.status === 409 && data.code === "in_progress") {
        setSubmitError("Seu pedido já está sendo processado. Aguarde alguns segundos.");
      } else {
        setSubmitError(typeof data.error === "string" ? data.error : "Não foi possível finalizar. Tente novamente.");
        if (data.field?.startsWith("customer")) setStep(0);
        else if (data.field?.startsWith("address")) setStep(1);
        else if (res.status === 402 || data.field?.startsWith("payment")) setStep(2);
      }
    } catch {
      idemKey.current = "";
      setSubmitError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  function finish(r: CheckoutResponse) {
    setDone(true);
    setCard({ holderName: "", number: "", expiry: "", ccv: "" });
    saveCompletedOrder(r);
    router.push(`/pedido/${encodeURIComponent(r.orderId)}`);
    window.setTimeout(clearCart, 300);
  }

  // ------------------------------------------------ estados de tela
  if (!ready || done) {
    return (
      <div className={`container ${s.page}`} aria-busy="true">
        <div className={s.loadingBox}>
          <Loader2 className={s.spin} size={28} />
          <p>{done ? "Pedido confirmado! Abrindo os detalhes…" : "Carregando checkout…"}</p>
        </div>
      </div>
    );
  }

  if (!cart.length) {
    return (
      <div className={`container ${s.page}`}>
        <div className={s.emptyBox}>
          <ShoppingBag size={36} strokeWidth={1.5} />
          <h1>Seu carrinho está vazio</h1>
          <p>Adicione produtos pronta-entrega para finalizar a compra.</p>
          <Link href="/loja?tipo=stock" className="btn btn-accent">Ver produtos <ArrowRight size={16} /></Link>
        </div>
      </div>
    );
  }

  const set = <K extends keyof Customer>(k: K, v: Customer[K]) => {
    setCustomer((c) => ({ ...c, [k]: v }));
    revalidate(0, k);
  };
  const setAddr = <K extends keyof Address>(k: K, v: string) => {
    setAddress((a) => ({ ...a, [k]: v }));
    revalidate(1, k);
  };
  const setC = <K extends keyof Card>(k: K, v: string) => {
    setCard((c) => ({ ...c, [k]: v }));
    revalidate(2, k);
  };

  const pixPrice = base.pixTotal;

  return (
    <div className={`container ${s.page}`}>
      <div className={s.topbar}>
        <Link href="/carrinho" className="btn btn-ghost btn-sm"><ArrowLeft size={15} /> Carrinho</Link>
        <span className={s.secure}><Lock size={14} /> Checkout seguro</span>
      </div>

      {demo && (
        <div className={s.demoBanner} role="status">
          <FlaskConical size={18} />
          <p><b>Pagamento em modo demonstração.</b> A integração com o Asaas ainda não está ativa: você pode concluir um pedido de teste, sem cobrança.</p>
        </div>
      )}
      {mode === "sandbox" && (
        <div className={s.demoBanner} role="status">
          <FlaskConical size={18} />
          <p><b>Ambiente de testes (sandbox do Asaas).</b> As cobranças geradas não são reais.</p>
        </div>
      )}

      <nav className={s.steps} aria-label="Etapas do checkout">
        <div className={s.stepsTrack} aria-hidden><span style={{ width: `${(step / (steps.length - 1)) * 100}%` }} /></div>
        <ol>
          {steps.map((st, i) => {
            const Icon = st.icon;
            const state = i < step ? "done" : i === step ? "current" : "todo";
            return (
              <li key={st.id} data-state={state}>
                <button type="button" onClick={() => i < step && goTo(i)} disabled={i > step} aria-current={i === step ? "step" : undefined}>
                  <span className={s.stepDot}>{state === "done" ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}</span>
                  <span className={s.stepLabel}>{st.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className={s.layout}>
        <div className={s.main}>
          <section className={s.panel} key={step} data-dir={dir}>
            {/* ------------------------------------------------ 1. Identificação */}
            {step === 0 && (
              <>
                <h1 ref={headingRef} tabIndex={-1} className={s.panelTitle}>Quem está comprando?</h1>
                <div className={s.segment} role="radiogroup" aria-label="Tipo de cliente">
                  {(["pf", "pj"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={customer.type === t}
                      onClick={() => {
                        setCustomer((c) => ({ ...c, type: t, document: "" }));
                        setErrors({});
                      }}
                    >
                      {t === "pf" ? <User size={16} /> : <Building2 size={16} />}
                      {t === "pf" ? "Pessoa física" : "Empresa (CNPJ)"}
                    </button>
                  ))}
                </div>
                <div className={s.grid}>
                  {customer.type === "pj" && (
                    <Field label="Razão social" error={errors.company} wide>
                      <input className="input" autoComplete="organization" value={customer.company} onChange={(e) => set("company", e.target.value)} />
                    </Field>
                  )}
                  <Field label={customer.type === "pj" ? "Nome do responsável" : "Nome completo"} error={errors.name} wide>
                    <input className="input" autoComplete="name" value={customer.name} onChange={(e) => set("name", e.target.value)} />
                  </Field>
                  <Field label={customer.type === "pj" ? "CNPJ" : "CPF"} error={errors.document}>
                    <input
                      className="input"
                      inputMode="numeric"
                      placeholder={customer.type === "pj" ? "00.000.000/0000-00" : "000.000.000-00"}
                      value={customer.document}
                      onChange={(e) => set("document", customer.type === "pj" ? maskCnpj(e.target.value) : maskCpf(e.target.value))}
                    />
                  </Field>
                  <Field label="Celular / WhatsApp" error={errors.phone}>
                    <input className="input" inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" value={customer.phone} onChange={(e) => set("phone", maskPhone(e.target.value))} />
                  </Field>
                  <Field label="E-mail" error={errors.email} hint="Enviaremos a confirmação e o layout para aprovação." wide>
                    <input className="input" type="email" autoComplete="email" value={customer.email} onChange={(e) => set("email", e.target.value.trim())} />
                  </Field>
                </div>
              </>
            )}

            {/* ------------------------------------------------ 2. Entrega */}
            {step === 1 && (
              <>
                <h1 ref={headingRef} tabIndex={-1} className={s.panelTitle}>Onde vamos entregar?</h1>
                <div className={s.grid}>
                  <Field label="CEP" error={errors.cep}>
                    <div className={s.withIcon}>
                      <input
                        className="input"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        placeholder="00000-000"
                        value={address.cep}
                        onChange={(e) => {
                          setErrors(({ cep: _c, ...rest }) => rest);
                          lookupCep(e.target.value);
                        }}
                      />
                      <span aria-live="polite">
                        {cepState === "loading" && <Loader2 size={18} className={s.spin} aria-label="Buscando CEP" />}
                        {cepState === "ok" && <Check size={18} className={s.okIcon} aria-label="CEP encontrado" />}
                      </span>
                    </div>
                  </Field>
                  <Field label="UF" error={errors.state}>
                    <select className="input" autoComplete="address-level1" value={address.state} onChange={(e) => setAddr("state", e.target.value)}>
                      <option value="">Selecione</option>
                      {UFS.map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </Field>
                  <Field label="Rua / avenida" error={errors.street} wide>
                    <input className="input" autoComplete="address-line1" value={address.street} onChange={(e) => setAddr("street", e.target.value)} />
                  </Field>
                  <Field label="Número" error={errors.number}>
                    <input ref={numberRef} className="input" value={address.number} onChange={(e) => setAddr("number", e.target.value)} />
                  </Field>
                  <Field label="Complemento (opcional)">
                    <input className="input" autoComplete="address-line2" value={address.complement} onChange={(e) => setAddr("complement", e.target.value)} />
                  </Field>
                  <Field label="Bairro" error={errors.district}>
                    <input className="input" value={address.district} onChange={(e) => setAddr("district", e.target.value)} />
                  </Field>
                  <Field label="Cidade" error={errors.city}>
                    <input className="input" autoComplete="address-level2" value={address.city} onChange={(e) => setAddr("city", e.target.value)} />
                  </Field>
                </div>

                <h2 className={s.subTitle}>Forma de entrega</h2>
                {shippingOptions ? (
                  <div className={s.options} role="radiogroup" aria-label="Forma de entrega">
                    {shippingOptions.map((o) => (
                      <label key={o.id} className={s.option} data-active={shipping?.id === o.id || undefined}>
                        <input type="radio" name="ship" checked={shipping?.id === o.id} onChange={() => { selectShipping(o.id); setErrors(({ shipping: _s, ...r }) => r); }} />
                        <span className={s.optionText}><b>{o.label}</b><small>{o.days}</small></span>
                        <strong>{o.price ? money(o.price) : "Grátis"}</strong>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className={s.muted}>Informe o CEP para ver as opções de entrega.</p>
                )}
                {errors.shipping && <p className={s.error} role="alert"><AlertCircle size={14} /> {errors.shipping}</p>}
                <p className={s.muted}>O prazo de entrega começa a contar após a aprovação do layout e a produção.</p>
              </>
            )}

            {/* ------------------------------------------------ 3. Pagamento */}
            {step === 2 && (
              <>
                <h1 ref={headingRef} tabIndex={-1} className={s.panelTitle}>Como prefere pagar?</h1>
                <div className={s.methods} role="radiogroup" aria-label="Forma de pagamento">
                  <MethodCard active={method === "pix"} onSelect={() => setMethod("pix")} icon={<QrCode size={22} />} title="Pix" badge={`${Math.round(PIX_DISCOUNT * 100)}% off`} highlight>
                    <b>{money(pixPrice)}</b> · aprovação na hora
                  </MethodCard>
                  <MethodCard active={method === "cartao"} onSelect={() => setMethod("cartao")} icon={<CreditCard size={22} />} title="Cartão de crédito">
                    até <b>{maxInst}x de {money(base.total / maxInst)}</b> sem juros
                  </MethodCard>
                  <MethodCard active={method === "boleto"} onSelect={() => setMethod("boleto")} icon={<Barcode size={22} />} title="Boleto bancário">
                    <b>{money(base.total)}</b> · compensa em até 2 dias úteis
                  </MethodCard>
                </div>

                {method === "pix" && (
                  <div className={s.methodInfo}>
                    <QrCode size={18} />
                    <p>O QR Code e o código copia e cola aparecem na próxima tela. Você economiza <b>{money(base.total - pixPrice)}</b>.</p>
                  </div>
                )}
                {method === "boleto" && (
                  <div className={s.methodInfo}>
                    <Barcode size={18} />
                    <p>O boleto vence em 3 dias. A produção começa após a compensação e a aprovação do layout.</p>
                  </div>
                )}
                {method === "cartao" && (
                  <div className={s.cardArea}>
                    <CardPreview
                      number={onlyDigits(card.number)}
                      holder={card.holderName}
                      expiry={card.expiry}
                      ccv={card.ccv}
                      brand={brand}
                      flipped={flipped}
                    />
                    <div className={s.grid}>
                      {demo && (
                        <p className={`${s.muted} ${s.wide}`}>No modo demonstração os dados do cartão não são enviados nem validados.</p>
                      )}
                      <Field label="Número do cartão" error={errors.number} wide>
                        <input
                          className="input"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          placeholder="0000 0000 0000 0000"
                          value={card.number}
                          onChange={(e) => setC("number", maskCard(e.target.value, detectBrand(e.target.value) === "amex"))}
                        />
                      </Field>
                      <Field label="Nome impresso no cartão" error={errors.holderName} wide>
                        <input className="input" autoComplete="cc-name" value={card.holderName} onChange={(e) => setC("holderName", e.target.value)} />
                      </Field>
                      <Field label="Validade" error={errors.expiry}>
                        <input className="input" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" value={card.expiry} onChange={(e) => setC("expiry", maskExpiry(e.target.value))} />
                      </Field>
                      <Field label="CVV" error={errors.ccv}>
                        <input
                          className="input"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          placeholder={brand === "amex" ? "0000" : "000"}
                          value={card.ccv}
                          onFocus={() => setFlipped(true)}
                          onBlur={() => setFlipped(false)}
                          onChange={(e) => setC("ccv", onlyDigits(e.target.value).slice(0, 4))}
                        />
                      </Field>
                      <Field label="Parcelas" error={errors.installments} wide>
                        <select className="input" value={installments} onChange={(e) => setInstallments(Number(e.target.value))}>
                          {Array.from({ length: maxInst }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>
                              {n}x de {money(base.total / n)} sem juros{n === 1 ? " (à vista)" : ""}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>
                )}
                <p className={s.secureNote}>
                  <ShieldCheck size={16} /> Dados de pagamento enviados com criptografia diretamente ao Asaas. Não armazenamos dados do cartão.
                </p>
              </>
            )}

            {/* ------------------------------------------------ 4. Revisão */}
            {step === 3 && (
              <>
                <h1 ref={headingRef} tabIndex={-1} className={s.panelTitle}>Revise e confirme</h1>
                <div className={s.review}>
                  <ReviewBlock title="Identificação" onEdit={() => goTo(0)}>
                    <p>{customer.type === "pj" ? customer.company : customer.name}</p>
                    {customer.type === "pj" && <p>{customer.name}</p>}
                    <p>{customer.document} · {customer.phone}</p>
                    <p>{customer.email}</p>
                  </ReviewBlock>
                  <ReviewBlock title="Entrega" onEdit={() => goTo(1)}>
                    <p>{address.street}, {address.number}{address.complement ? ` — ${address.complement}` : ""}</p>
                    <p>{address.district} · {address.city}/{address.state} · {address.cep}</p>
                    <p>{shipping?.label} · {shipping?.days}</p>
                  </ReviewBlock>
                  <ReviewBlock title="Pagamento" onEdit={() => goTo(2)}>
                    {method === "pix" && <p>Pix com 5% de desconto · {money(pixPrice)}</p>}
                    {method === "boleto" && <p>Boleto bancário · {money(base.total)}</p>}
                    {method === "cartao" && (
                      <p>
                        Cartão {brand !== "unknown" ? brand.toUpperCase() : ""} {card.number ? `final ${onlyDigits(card.number).slice(-4)}` : ""} · {installments}x de {money(base.total / installments)}
                      </p>
                    )}
                  </ReviewBlock>
                </div>

                <label className={s.accept} data-error={!!errors.accepted || undefined}>
                  <input type="checkbox" checked={accepted} onChange={(e) => { setAccepted(e.target.checked); setErrors(({ accepted: _a, ...r }) => r); }} />
                  <span>
                    Li e concordo com a <Link href="/privacidade" target="_blank">política de privacidade</Link> e entendo que a produção começa após a minha aprovação do layout.
                  </span>
                </label>
                {errors.accepted && <p className={s.error} role="alert"><AlertCircle size={14} /> {errors.accepted}</p>}
              </>
            )}

            {submitError && (
              <div className={s.submitError} role="alert">
                <AlertCircle size={18} />
                <p>{submitError}</p>
              </div>
            )}

            <div className={s.actions}>
              {step > 0 ? (
                <button type="button" className="btn btn-ghost" onClick={() => { setErrors({}); setStep(step - 1); }} disabled={submitting}>
                  <ArrowLeft size={16} /> Voltar
                </button>
              ) : (
                <span />
              )}
              {step < 3 ? (
                <button type="button" className="btn btn-primary btn-lg" onClick={() => goTo(step + 1)}>
                  Continuar <ArrowRight size={18} />
                </button>
              ) : (
                <button type="button" className={`btn btn-accent btn-lg ${s.finish}`} onClick={submit} disabled={submitting} aria-busy={submitting}>
                  {submitting ? (
                    <><Loader2 size={18} className={s.spin} /> Processando…</>
                  ) : demo ? (
                    <>Concluir pedido de teste <ArrowRight size={18} /></>
                  ) : (
                    <>
                      <Lock size={16} /> Finalizar · <AnimatedMoney value={summaryTotals.chargeTotal} />
                    </>
                  )}
                </button>
              )}
            </div>
          </section>
        </div>

        <OrderSummary lines={cart} totals={summaryTotals} />
      </div>
    </div>
  );
}

function Field({ label, error, hint, wide, children }: { label: string; error?: string; hint?: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`${s.field} ${wide ? s.wide : ""}`} data-error={error ? true : undefined}>
      <span className={s.label}>{label}</span>
      {children}
      {error ? (
        <span className={s.error} role="alert"><AlertCircle size={13} /> {error}</span>
      ) : hint ? (
        <span className={s.hint}>{hint}</span>
      ) : null}
    </label>
  );
}

function MethodCard({ active, onSelect, icon, title, badge, highlight, children }: { active: boolean; onSelect: () => void; icon: ReactNode; title: string; badge?: string; highlight?: boolean; children: ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={active} className={s.method} data-active={active || undefined} data-highlight={highlight || undefined} onClick={onSelect}>
      <span className={s.methodIcon}>{icon}</span>
      <span className={s.methodText}>
        <strong>{title} {badge && <span className="chip chip-success">{badge}</span>}</strong>
        <small>{children}</small>
      </span>
      <span className={s.radio} aria-hidden />
    </button>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <div className={s.reviewBlock}>
      <div className={s.reviewHead}>
        <h3>{title}</h3>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit}><Pencil size={14} /> Editar</button>
      </div>
      {children}
    </div>
  );
}
