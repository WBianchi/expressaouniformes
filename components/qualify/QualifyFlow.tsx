"use client";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Factory, Loader2, MessageCircle, ShoppingBag, TriangleAlert } from "lucide-react";
import { getProduct, inStock, products, whatsappLink } from "@/lib/catalog";
import { leadSchema } from "@/lib/lead";
import {
  artTechniques,
  emptyQualify,
  fabricOptions,
  isQualified,
  qtyOptions,
  qualifyMessage,
  routeFor,
  type QualifyAnswers,
} from "@/lib/qualify";
import { CUSTOM_MIN_QTY, STOCK_MIN_QTY } from "@/lib/quote";
import s from "./Qualify.module.css";

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
};

type Contact = { name: string; phone: string; company: string; email: string; website: string };

/**
 * Qualificação do cliente: quantidade, produto e personalização.
 * Poucas peças → simulador e compra no site. 30+ → fabricação com consultor.
 * O contato fica salvo para recuperar quem não finalizar.
 */
export function QualifyFlow({ product: fixed, source, onNavigate }: { product?: string; source: string; onNavigate?: () => void }) {
  const uid = useId();
  const [a, setA] = useState<QualifyAnswers>(() => emptyQualify(fixed ?? null));
  const [contact, setContact] = useState<Contact>({ name: "", phone: "", company: "", email: "", website: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Contact, string>>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const route = routeFor(a);
  const product = a.product ? getProduct(a.product) : undefined;
  const techniques = useMemo(() => {
    const own = product?.techniques ?? [];
    return artTechniques.filter((t) => t.id === "nao-sei" || own.some((x) => x.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "") === t.id));
  }, [product]);
  const set = (patch: Partial<QualifyAnswers>) => setA((cur) => ({ ...cur, ...patch }));
  const ready = isQualified(a) && route !== "minimo";

  const simulatorHref = product
    ? `/produto/${product.slug}?${new URLSearchParams({ qtd: a.qty ?? "", ...(a.custom && a.technique && a.technique !== "nao-sei" ? { tecnica: a.technique } : {}) })}`
    : "/loja?tipo=stock";

  async function submit(skip = false) {
    if (!product || !a.qty || !route) return;
    if (!skip) {
      const r = leadSchema.safeParse({
        ...contact,
        product: product.slug,
        qty: a.qty,
        route,
        custom: !!a.custom,
        technique: a.custom ? (a.technique ?? "") : "",
        fabric: a.fabric,
        source: campaignSource(source),
      });
      if (!r.success) {
        const e: typeof errors = {};
        for (const i of r.error.issues) e[i.path[0] as keyof Contact] ??= i.message;
        setErrors(e);
        return;
      }
      setErrors({});
      setSending(true);
      // o contato é só para retorno; se a gravação falhar, o cliente segue mesmo assim
      await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(r.data) }).catch(() => null);
      setSending(false);
    }
    setDone(true);
  }

  const field = (k: keyof Contact) => ({
    id: `${uid}-${k}`,
    value: contact[k],
    "aria-invalid": errors[k] ? true : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setContact((c) => ({ ...c, [k]: k === "phone" ? maskPhone(e.target.value) : e.target.value })),
  });

  if (done && product && route)
    return (
      <Result
        route={route}
        answers={a}
        contact={contact}
        productName={product.name}
        available={inStock(product)}
        similarHref={`/loja?tipo=stock&categoria=${product.category}`}
        simulatorHref={simulatorHref}
        onNavigate={onNavigate}
      />
    );

  return (
    <div className={s.flow}>
      {/* 1. quantidade */}
      <fieldset className={s.group}>
        <legend>
          <span className={s.num}>1</span> Quantas peças você precisa?
        </legend>
        <div className={s.options} role="radiogroup" aria-label="Quantidade de peças">
          {qtyOptions.map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={a.qty === o.id} className={s.option} onClick={() => set({ qty: o.id })}>
              {o.label}
            </button>
          ))}
        </div>
        {route && route !== "minimo" && (
          <p className={s.path} data-route={route}>
            {route === "loja" ? (
              <>
                <ShoppingBag size={15} /> Compra rápida: você monta, vê a logo na peça e finaliza no site.
              </>
            ) : (
              <>
                <Factory size={15} /> Pedido de fabricação: um consultor monta o orçamento com você.
              </>
            )}
          </p>
        )}
        {route === "minimo" && (
          <p className={s.warn} role="alert">
            <TriangleAlert size={15} /> O pedido mínimo é de {STOCK_MIN_QTY} peças (pode misturar tamanhos).
          </p>
        )}
      </fieldset>

      {/* 2. produto */}
      {!fixed && a.qty && route !== "minimo" && (
        <fieldset className={s.group}>
          <legend>
            <span className={s.num}>2</span> Qual produto?
          </legend>
          <select className="input" value={a.product ?? ""} onChange={(e) => set({ product: e.target.value || null, technique: null })} aria-label="Produto">
            <option value="">Selecione</option>
            {products.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </fieldset>
      )}

      {/* 3. personalização da arte */}
      {a.qty && route !== "minimo" && a.product && (
        <fieldset className={s.group}>
          <legend>
            <span className={s.num}>{fixed ? 2 : 3}</span> Vai colocar a sua logo ou arte?
          </legend>
          <div className={s.options} role="radiogroup" aria-label="Personalização">
            <button type="button" role="radio" aria-checked={a.custom === true} className={s.option} onClick={() => set({ custom: true })}>
              Sim, com a minha logo
            </button>
            <button type="button" role="radio" aria-checked={a.custom === false} className={s.option} onClick={() => set({ custom: false, technique: null })}>
              Não, peça lisa
            </button>
          </div>
          {a.custom && (
            <>
              <p className={s.label}>Como aplicar a logo?</p>
              <div className={s.cards} role="radiogroup" aria-label="Técnica de aplicação">
                {techniques.map((t) => (
                  <button key={t.id} type="button" role="radio" aria-checked={a.technique === t.id} className={s.card} onClick={() => set({ technique: t.id })}>
                    <b>{t.label}</b>
                    <small>{t.hint}</small>
                  </button>
                ))}
              </div>
            </>
          )}
        </fieldset>
      )}

      {/* 4. personalização da peça: só fabricação */}
      {route === "fabrica" && isQualified(a) && (
        <fieldset className={s.group}>
          <legend>
            <span className={s.num}>{fixed ? 3 : 4}</span> Quer personalizar a peça também? <small className={s.optional}>opcional</small>
          </legend>
          <p className={s.note}>Exclusivo para pedidos de fabricação: escolhemos juntos tecido, gola, botões, frisos e cores.</p>
          <div className={s.options} role="group" aria-label="Personalização da peça">
            {fabricOptions.map((o) => {
              const on = a.fabric.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={on}
                  className={s.option}
                  onClick={() => set({ fabric: on ? a.fabric.filter((f) => f !== o.id) : [...a.fabric, o.id] })}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* 5. contato */}
      {ready && (
        <form
          className={s.group}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          noValidate
        >
          <fieldset className={s.contact}>
            <legend>
              <span className={s.num}>{(fixed ? 3 : 4) + (route === "fabrica" ? 1 : 0)}</span> Para onde enviamos a sua simulação?
            </legend>
            <div className={s.grid}>
              <label className={s.field} htmlFor={`${uid}-name`}>
                Nome
                <input className="input" autoComplete="name" {...field("name")} />
                {errors.name && <small>{errors.name}</small>}
              </label>
              <label className={s.field} htmlFor={`${uid}-phone`}>
                WhatsApp
                <input className="input" inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" {...field("phone")} />
                {errors.phone && <small>{errors.phone}</small>}
              </label>
              <label className={s.field} htmlFor={`${uid}-company`}>
                Empresa <span className={s.optional}>opcional</span>
                <input className="input" autoComplete="organization" {...field("company")} />
              </label>
              <label className={s.field} htmlFor={`${uid}-email`}>
                E-mail <span className={s.optional}>opcional</span>
                <input className="input" type="email" autoComplete="email" {...field("email")} />
                {errors.email && <small>{errors.email}</small>}
              </label>
              {/* armadilha para robôs: invisível para pessoas */}
              <input className={s.trap} tabIndex={-1} autoComplete="off" aria-hidden {...field("website")} />
            </div>
            <p className={s.note}>Usamos seu contato só para falar sobre este pedido. Nada de spam.</p>
          </fieldset>
          <div className={s.actions}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={sending}>
              {sending ? <Loader2 size={18} className={s.spin} /> : null}
              {route === "loja" ? "Ir para o simulador" : "Ver meu orçamento"} <ArrowRight size={18} />
            </button>
            {route === "loja" && (
              <button type="button" className={s.skip} onClick={() => submit(true)}>
                Pular e simular agora
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function Result({
  route,
  answers,
  contact,
  productName,
  available,
  similarHref,
  simulatorHref,
  onNavigate,
}: {
  route: "minimo" | "loja" | "fabrica";
  answers: QualifyAnswers;
  contact: Contact;
  productName: string;
  /** modelo em estoque para compra no site */
  available: boolean;
  similarHref: string;
  simulatorHref: string;
  onNavigate?: () => void;
}) {
  // poucas peças de um modelo que só sai na fabricação: oferece os prontos parecidos
  if (route === "loja" && !available)
    return (
      <div className={s.result} data-route="loja" aria-live="polite">
        <span className={s.resultIcon}>
          <ShoppingBag size={30} />
        </span>
        <h3>Este modelo é produzido a partir de {CUSTOM_MIN_QTY} peças</h3>
        <p>
          Para pedidos menores, temos modelos parecidos prontos para personalizar e comprar pelo site, a partir de {STOCK_MIN_QTY} peças, com a sua logo em
          silk, bordado, DTF ou sublimação.
        </p>
        <Link href={similarHref} className="btn btn-primary btn-lg btn-block" onClick={onNavigate}>
          Ver modelos de pronta-entrega <ArrowRight size={18} />
        </Link>
        <a
          className="btn btn-outline btn-block"
          href={whatsappLink(qualifyMessage(answers, productName, { name: contact.name, company: contact.company }))}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={18} /> Tirar dúvidas com um consultor
        </a>
      </div>
    );
  if (route === "fabrica")
    return (
      <div className={s.result} data-route="fabrica" aria-live="polite">
        <span className={s.resultIcon}>
          <BadgeCheck size={30} />
        </span>
        <h3>Seu pedido é de fabricação</h3>
        <p>
          A partir de {CUSTOM_MIN_QTY} peças você fala direto com um consultor da fábrica: modelo, tecido, cores, personalização, prazo e o melhor preço
          para o volume.
        </p>
        <a
          className="btn btn-whatsapp btn-lg btn-block"
          href={whatsappLink(qualifyMessage(answers, productName, { name: contact.name, company: contact.company }))}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={19} /> Falar com um consultor
        </a>
        <Link href="/orcamento" className="btn btn-outline btn-block" onClick={onNavigate}>
          Montar o pedido no site com vários modelos
        </Link>
      </div>
    );
  return (
    <div className={s.result} data-route="loja" aria-live="polite">
      <span className={s.resultIcon}>
        <ShoppingBag size={30} />
      </span>
      <h3>Seu pedido sai direto pelo site</h3>
      <p>
        Escolha cor e tamanhos, envie sua logo, veja como fica na peça e finalize a compra, sem precisar falar com vendedor. Depois é só aguardar o prazo
        de entrega informado.
      </p>
      <Link href={simulatorHref} className="btn btn-primary btn-lg btn-block" onClick={onNavigate}>
        Abrir o simulador <ArrowRight size={18} />
      </Link>
    </div>
  );
}

/** Origem do contato: página + campanha do anúncio (utm), quando houver. */
function campaignSource(base: string) {
  if (typeof window === "undefined") return base;
  const q = new URLSearchParams(window.location.search);
  const utm = ["utm_source", "utm_campaign"].map((k) => q.get(k)).filter(Boolean).join("/");
  return (utm ? `${base} · ${utm}` : base).slice(0, 200);
}
