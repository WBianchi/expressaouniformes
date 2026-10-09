"use client";
import Link from "next/link";
import { MessageCircle, Send } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { whatsappLink } from "@/lib/catalog";
import s from "./contato.module.css";

const subjects = [
  "Pronta-entrega (peças em estoque)",
  "Produção sob medida para empresa",
  "Camisetas para evento ou igreja",
  "Pedido em andamento",
  "Outro assunto",
];

type Errors = Partial<Record<"name" | "contact" | "message", string>>;

export function ContactForm() {
  const id = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    const name = get("name");
    const company = get("company");
    const contact = get("contact");
    const subject = get("subject");
    const qty = get("qty");
    const message = get("message");

    const next: Errors = {};
    if (name.length < 2) next.name = "Informe o seu nome.";
    if (contact.replace(/\D/g, "").length < 10 && !/^\S+@\S+\.\S+$/.test(contact)) next.contact = "Informe um telefone com DDD ou um e-mail válido.";
    if (message.length < 10) next.message = "Conte um pouco mais sobre o que você precisa (mínimo de 10 caracteres).";
    setErrors(next);
    if (Object.keys(next).length) {
      const first = Object.keys(next)[0];
      (e.currentTarget.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }

    const text = [
      `Olá! Meu nome é ${name}${company ? `, da ${company}` : ""}.`,
      `Assunto: ${subject}`,
      qty ? `Quantidade estimada: ${qty} peças` : null,
      `Contato: ${contact}`,
      "",
      message,
    ]
      .filter((l) => l !== null)
      .join("\n");

    window.open(whatsappLink(text), "_blank", "noopener,noreferrer");
    setSent(true);
  }

  const field = (k: keyof Errors) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${id}-${k}-err` : undefined,
  });

  return (
    <form className={s.form} onSubmit={onSubmit} noValidate>
      <div className={s.formHead}>
        <span className={s.formIcon}>
          <MessageCircle size={22} strokeWidth={1.75} />
        </span>
        <div>
          <h2>Envie sua mensagem</h2>
          <p>Montamos o texto e abrimos o WhatsApp para você enviar ao nosso time.</p>
        </div>
      </div>

      <div className={s.row}>
        <label className={s.field}>
          <span>Nome *</span>
          <input name="name" className="input" autoComplete="name" placeholder="Como podemos te chamar?" {...field("name")} />
          {errors.name && (
            <small id={`${id}-name-err`} className={s.error}>
              {errors.name}
            </small>
          )}
        </label>
        <label className={s.field}>
          <span>Empresa ou grupo</span>
          <input name="company" className="input" autoComplete="organization" placeholder="Opcional" />
        </label>
      </div>

      <div className={s.row}>
        <label className={s.field}>
          <span>Telefone ou e-mail *</span>
          <input name="contact" className="input" autoComplete="tel" placeholder="(11) 90000-0000" {...field("contact")} />
          {errors.contact && (
            <small id={`${id}-contact-err`} className={s.error}>
              {errors.contact}
            </small>
          )}
        </label>
        <label className={s.field}>
          <span>Quantidade estimada</span>
          <input name="qty" className="input" inputMode="numeric" placeholder="Ex.: 30" />
        </label>
      </div>

      <label className={s.field}>
        <span>Assunto</span>
        <select name="subject" className={`input ${s.select}`} defaultValue={subjects[0]}>
          {subjects.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>

      <label className={s.field}>
        <span>Mensagem *</span>
        <textarea
          name="message"
          className={`input ${s.textarea}`}
          rows={5}
          placeholder="Modelos, cores, prazo desejado, onde vai a logo…"
          {...field("message")}
        />
        {errors.message && (
          <small id={`${id}-message-err`} className={s.error}>
            {errors.message}
          </small>
        )}
      </label>

      <button type="submit" className="btn btn-whatsapp btn-lg btn-block">
        <Send size={18} /> Enviar pelo WhatsApp
      </button>
      <p className={s.formNote} role="status">
        {sent ? (
          "Pronto! Abrimos o WhatsApp em uma nova aba. Se não abriu, verifique o bloqueador de pop-ups."
        ) : (
          <>
            Seus dados são usados apenas para responder ao seu contato. Veja a nossa <Link href="/privacidade">política de privacidade</Link>.
          </>
        )}
      </p>
    </form>
  );
}
