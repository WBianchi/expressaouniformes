"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, ClipboardList, MessageCircle, ShoppingBag } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { whatsappLink } from "@/lib/catalog";
import {
  CUSTOM_MIN_QTY,
  STOCK_MIN_QTY,
  emptyAnswers,
  employeeOptions,
  isComplete,
  isEligible,
  quantityOptions,
  quoteMessage,
  type QuoteAnswers,
} from "@/lib/quote";
import s from "./QuoteGate.module.css";

/**
 * Questionário rápido antes de liberar o contato com o consultor.
 * Pedidos abaixo do mínimo de fabricação são direcionados à linha de estoque.
 */
export function QuoteGate({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [a, setA] = useState<QuoteAnswers>(emptyAnswers);
  const [done, setDone] = useState(false);

  const change = (o: boolean) => {
    onOpenChange(o);
    if (!o) setDone(false);
  };

  const eligible = isEligible(a);

  return (
    <Drawer
      open={open}
      onOpenChange={change}
      title="Solicitar orçamento"
      description={done ? "Resultado da triagem" : "2 perguntas rápidas para direcionar o seu pedido"}
      width={500}
      footer={
        done ? (
          eligible ? (
            <div className={s.actions}>
              <a className="btn btn-whatsapp btn-lg btn-block" href={whatsappLink(quoteMessage(a))} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={19} /> Falar com um consultor
              </a>
              <Link href="/orcamento" className="btn btn-outline btn-block" onClick={() => change(false)}>
                <ClipboardList size={17} /> Montar meu pedido no site
              </Link>
            </div>
          ) : (
            <div className={s.actions}>
              <Link href="/loja?tipo=stock" className={`btn btn-lg btn-block ${s.ctaSuccess}`} onClick={() => change(false)}>
                <ShoppingBag size={19} /> Personalizar e comprar
              </Link>
              <button type="button" className="btn btn-ghost btn-block" onClick={() => setDone(false)}>
                <ArrowLeft size={17} /> Revisar respostas
              </button>
            </div>
          )
        ) : (
          <button type="button" className="btn btn-primary btn-lg btn-block" disabled={!isComplete(a)} onClick={() => setDone(true)}>
            Ver resultado <ArrowRight size={18} />
          </button>
        )
      }
    >
      {!done ? (
        <div className={s.form}>
          <fieldset className={s.group}>
            <legend>
              <span className={s.num}>1</span> Quantas peças você precisa?
            </legend>
            <div className={s.options} role="radiogroup" aria-label="Quantidade de peças">
              {quantityOptions.map((o) => (
                <button key={o.id} type="button" role="radio" aria-checked={a.quantity === o.id} className={s.option} data-active={a.quantity === o.id || undefined} onClick={() => setA((p) => ({ ...p, quantity: o.id }))}>
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={s.group}>
            <legend>
              <span className={s.num}>2</span> Quantos funcionários vão usar o uniforme?
            </legend>
            <div className={s.options} role="radiogroup" aria-label="Número de funcionários">
              {employeeOptions.map((o) => (
                <button key={o.id} type="button" role="radio" aria-checked={a.employees === o.id} className={s.option} data-active={a.employees === o.id || undefined} onClick={() => setA((p) => ({ ...p, employees: o.id }))}>
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>

        </div>
      ) : (
        <div className={s.result} data-tone={eligible ? "brand" : "success"} aria-live="polite">
          <span className={s.resultIcon}>{eligible ? <BadgeCheck size={30} /> : <ShoppingBag size={30} />}</span>
          {eligible ? (
            <>
              <h3>Seu pedido atende ao mínimo de fabricação</h3>
              <p>
                Um consultor recebe suas respostas pelo WhatsApp e monta o orçamento com você: modelos, cores, personalização e prazo.
              </p>
            </>
          ) : (
            <>
              <h3>Para esse volume, a linha pronta é o melhor caminho</h3>
              <p>
                O orçamento para empresas começa em <b>{CUSTOM_MIN_QTY} peças</b>. Com os uniformes prontos para personalizar, você compra online a partir de{" "}
                <b>{STOCK_MIN_QTY} peças</b>, coloca a sua logo, aprova o layout no site e recebe em poucos dias.
              </p>
            </>
          )}
        </div>
      )}
    </Drawer>
  );
}
