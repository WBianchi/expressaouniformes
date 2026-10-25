"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCircle2, Copy, MessageCircle, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { categories, getColor, getProduct, inStock, positionFees, products, whatsappLink, type Position } from "@/lib/catalog";
import { availablePositions } from "@/lib/mockup";
import { CUSTOM_MIN_QTY, STOCK_MIN_QTY, employeeOptions } from "@/lib/quote";
import { emptyCompany, quoteRequestMessage, type QuoteCompany } from "@/lib/quote-message";
import { LogoMockup } from "@/components/product/LogoMockup";
import { LogoUpload } from "@/components/product/LogoUpload";
import { logoThumbs, useBrandLogos } from "@/components/product/useBrandLogo";
import { Stepper, Swatches } from "@/components/ui/primitives";
import { useQuote } from "./useQuote";
import s from "./Quote.module.css";

const companySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da empresa"),
  cnpj: z.string().refine((v) => !v.trim() || v.replace(/\D/g, "").length === 14, "O CNPJ deve ter 14 dígitos"),
  contact: z.string().trim().min(3, "Informe o nome do responsável"),
  phone: z.string().refine((v) => v.replace(/\D/g, "").length >= 10, "Informe um telefone com DDD"),
  email: z.email("Informe um e-mail válido"),
  city: z.string().trim().min(2, "Informe a cidade"),
});
type Errors = Partial<Record<keyof QuoteCompany, string>>;

const statusLabel = (slug: string) => {
  const p = getProduct(slug)!;
  return p.kind === "custom" ? "Sob encomenda" : inStock(p) ? "Pronta-entrega" : "Sob cotação";
};

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
};

export function QuoteBuilder({ initial }: { initial?: string }) {
  const { items, total, add, update, remove, clear } = useQuote();
  const [logos, setLogo] = useBrandLogos();
  const thumbs = logoThumbs(logos);
  const [cat, setCat] = useState<string>("todos");
  const [company, setCompany] = useState<QuoteCompany>(emptyCompany);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const added = useRef(false);

  // links antigos (?modelo=) e "adicionar ao orçamento" vindos de outras páginas
  useEffect(() => {
    if (added.current || !initial) return;
    added.current = true;
    const p = getProduct(initial);
    if (p) add({ slug: p.slug, color: p.colors[0], qty: CUSTOM_MIN_QTY, positions: availablePositions(p).slice(0, 1) }, { silent: true, ifAbsent: true });
  }, [initial, add]);

  // posições usadas em algum item (sem itens, mostra a frente)
  const usedPositions = (["frente", "costas", "manga"] as Position[]).filter((p) => items.some((i) => i.positions.includes(p)));
  if (!usedPositions.length) usedPositions.push("frente");

  const list = useMemo(() => (cat === "todos" ? products : products.filter((p) => p.category === cat)), [cat]);
  const minOk = total >= CUSTOM_MIN_QTY;
  const pct = Math.min(100, (total / CUSTOM_MIN_QTY) * 100);

  const field = (k: keyof QuoteCompany) => ({
    value: company[k],
    "aria-invalid": !!errors[k] || undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const v = k === "phone" ? maskPhone(e.target.value) : e.target.value;
      setCompany((c) => ({ ...c, [k]: v }));
      if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
    },
  });

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!items.length) {
      toast.error("Adicione pelo menos um produto ao pedido.");
      return;
    }
    if (!minOk) {
      toast.error(`O orçamento para empresas começa em ${CUSTOM_MIN_QTY} peças.`);
      return;
    }
    const r = companySchema.safeParse(company);
    if (!r.success) {
      const errs: Errors = {};
      for (const i of r.error.issues) errs[i.path[0] as keyof QuoteCompany] ??= i.message;
      setErrors(errs);
      formRef.current?.querySelector<HTMLElement>("[aria-invalid]")?.focus();
      return;
    }
    window.open(whatsappLink(quoteRequestMessage(items, company, Object.fromEntries(Object.entries(logos).map(([p, l]) => [p, l.name])))), "_blank", "noopener,noreferrer");
    setSent(true);
  }

  return (
    <div className={s.layout}>
      <div className={s.main}>
        {/* 1. itens */}
        <section className={s.block} aria-labelledby="q-items">
          <header className={s.blockHead}>
            <h2 id="q-items">
              <span className={s.num}>1</span> Itens do pedido
            </h2>
            {items.length > 0 && (
              <button type="button" className={s.link} onClick={clear}>
                Limpar
              </button>
            )}
          </header>

          {items.length === 0 ? (
            <p className={s.empty}>Nenhum item ainda. Escolha os modelos abaixo: dá para misturar peças, cores e quantidades.</p>
          ) : (
            <ul className={s.items}>
              {items.map((i) => {
                const p = getProduct(i.slug)!;
                return (
                  <li key={i.id} className={s.item}>
                    <Link href={`/produto/${p.slug}`} className={s.itemImg} aria-label={p.name}>
                      <LogoMockup product={p} view="front" positions={i.positions} logos={thumbs} markers={false} />
                    </Link>
                    <div className={s.itemBody}>
                      <div className={s.itemTop}>
                        <div>
                          <b>{p.name}</b>
                          <small>
                            {statusLabel(p.slug)} · {getColor(i.color)?.name}
                          </small>
                        </div>
                        <button type="button" className="icon-btn" aria-label={`Remover ${p.name}`} onClick={() => remove(i.id)}>
                          <Trash2 size={17} />
                        </button>
                      </div>
                      <Swatches ids={p.colors} value={i.color} onChange={(color) => update(i.id, { color })} size="sm" />
                      <div className={s.itemControls}>
                        <Stepper size="sm" value={i.qty} onChange={(qty) => update(i.id, { qty: Math.max(1, qty) })} min={1} max={100000} label={`quantidade de ${p.name}`} />
                        <div className={s.posChips} role="group" aria-label="Posições da logo">
                          {availablePositions(p).map((pos) => {
                            const on = i.positions.includes(pos);
                            const next: Position[] = on ? i.positions.filter((x) => x !== pos) : [...i.positions, pos];
                            return (
                              <button key={pos} type="button" className={s.chip} aria-pressed={on} onClick={() => update(i.id, { positions: next })}>
                                {on && <Check size={12} strokeWidth={3} />} {positionFees[pos].label.replace(" (peito)", "")}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className={s.pickerHead}>
            <h3>Adicionar modelos</h3>
            <div className={s.cats} role="tablist" aria-label="Categorias">
              {[{ slug: "todos", name: "Todos" }, ...categories].map((c) => (
                <button key={c.slug} type="button" role="tab" aria-selected={cat === c.slug} className={s.cat} onClick={() => setCat(c.slug)}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <ul className={s.picker}>
            {list.map((p) => {
              const count = items.filter((i) => i.slug === p.slug).reduce((t, i) => t + i.qty, 0);
              return (
                <li key={p.slug}>
                  <button
                    type="button"
                    className={s.pick}
                    data-on={count > 0 || undefined}
                    onClick={() => add({ slug: p.slug, color: p.colors[0], qty: 10, positions: availablePositions(p).slice(0, 1) }, { silent: true })}
                  >
                    <span className={s.pickImg}>
                      <LogoMockup product={p} view="front" positions={[]} />
                      <span className={s.pickAdd} aria-hidden>
                        {count > 0 ? <span>{count}</span> : <Plus size={16} />}
                      </span>
                    </span>
                    <b>{p.name}</b>
                    <small>{statusLabel(p.slug)}</small>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 2. logo */}
        <section className={s.block} aria-labelledby="q-logo">
          <header className={s.blockHead}>
            <h2 id="q-logo">
              <span className={s.num}>2</span> Sua logo
            </h2>
            <span className={s.hint}>uma arte para cada posição</span>
          </header>
          <div className={s.logos}>
            {usedPositions.map((pos) => {
              const others = usedPositions.filter((p) => p !== pos && logos[p] && logos[p]!.thumb !== logos[pos]?.thumb);
              return (
                <div key={pos} className={s.logoSlot}>
                  <b>{positionFees[pos].label}</b>
                  <LogoUpload value={logos[pos] ?? null} onChange={(v) => setLogo(pos, v)} label={`Logo da ${positionFees[pos].label.toLowerCase()}`} compact />
                  {!logos[pos] &&
                    others.map((p) => (
                      <button key={p} type="button" className={s.copyBtn} onClick={() => setLogo(pos, logos[p]!)}>
                        <Copy size={13} /> Usar a mesma da {positionFees[p].label.split(" ")[0].toLowerCase()}
                      </button>
                    ))}
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. empresa */}
        <form ref={formRef} className={s.block} aria-labelledby="q-company" onSubmit={send} noValidate id="quote-form">
          <header className={s.blockHead}>
            <h2 id="q-company">
              <span className={s.num}>3</span> Dados da empresa
            </h2>
          </header>
          <div className={s.grid}>
            <Field label="Empresa" error={errors.name}>
              <input className="input" autoComplete="organization" {...field("name")} />
            </Field>
            <Field label="CNPJ (opcional)" error={errors.cnpj}>
              <input className="input" inputMode="numeric" {...field("cnpj")} />
            </Field>
            <Field label="Responsável" error={errors.contact}>
              <input className="input" autoComplete="name" {...field("contact")} />
            </Field>
            <Field label="WhatsApp" error={errors.phone}>
              <input className="input" inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" {...field("phone")} />
            </Field>
            <Field label="E-mail" error={errors.email}>
              <input className="input" type="email" autoComplete="email" {...field("email")} />
            </Field>
            <Field label="Cidade / UF" error={errors.city}>
              <input className="input" autoComplete="address-level2" placeholder="Cajamar/SP" {...field("city")} />
            </Field>
            <Field label="Funcionários que vão usar">
              <select className="input" {...field("employees")}>
                <option value="">Selecione</option>
                {employeeOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Observações (opcional)" wide>
              <textarea className="input" rows={3} maxLength={1000} placeholder="Prazo desejado, tamanhos, dúvidas…" {...field("notes")} />
            </Field>
          </div>
        </form>
      </div>

      {/* resumo */}
      <aside className={s.aside} aria-label="Resumo do pedido">
        <div className={s.summary}>
          <h2>Resumo</h2>
          <div className={s.totalRow}>
            <span>Total de peças</span>
            <strong>{total}</strong>
          </div>
          <div className={s.bar} role="progressbar" aria-valuemin={0} aria-valuemax={CUSTOM_MIN_QTY} aria-valuenow={Math.min(total, CUSTOM_MIN_QTY)} aria-label="Pedido mínimo">
            <span style={{ width: `${pct}%` }} data-ok={minOk || undefined} />
          </div>
          {minOk ? (
            <p className={s.ok}>
              <CheckCircle2 size={15} /> Pedido mínimo atingido
            </p>
          ) : (
            <p className={s.muted}>Mínimo de {CUSTOM_MIN_QTY} peças no total{total > 0 && ` · faltam ${CUSTOM_MIN_QTY - total}`}</p>
          )}

          {items.length > 0 && (
            <ul className={s.sumList}>
              {items.map((i) => (
                <li key={i.id}>
                  <span>{getProduct(i.slug)?.name}</span>
                  <b>{i.qty}</b>
                </li>
              ))}
            </ul>
          )}

          {total > 0 && !minOk && (
            <div className={s.below}>
              <p>
                Para menos de {CUSTOM_MIN_QTY} peças, compre direto na loja: a linha pronta-entrega sai a partir de {STOCK_MIN_QTY} peças, com a sua logo e
                pagamento online.
              </p>
              <Link href="/loja" className="btn btn-outline btn-block">
                <ShoppingBag size={17} /> Ver pronta-entrega
              </Link>
            </div>
          )}

          <button type="submit" form="quote-form" className="btn btn-primary btn-lg btn-block" disabled={!minOk}>
            <MessageCircle size={18} /> Enviar para um consultor
          </button>
          <p className={s.muted}>O pedido abre no WhatsApp com todos os itens. O consultor retorna com preço, prazo e layout.</p>
          {sent && (
            <p className={s.ok} role="status">
              <CheckCircle2 size={15} /> Pedido aberto no WhatsApp. Envie a mensagem e a sua logo por lá.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function Field({ label, error, wide, children }: { label: string; error?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={s.field} data-wide={wide || undefined}>
      <span>{label}</span>
      {children}
      {error && <small role="alert">{error}</small>}
    </label>
  );
}
