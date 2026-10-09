"use client";
import { MessageCircle, Plus } from "lucide-react";
import { useId, useState } from "react";
import { whatsappLink } from "@/lib/catalog";
import { faqs } from "./faqData";
import { Reveal } from "./Reveal";
import sec from "./section.module.css";
import s from "./Faq.module.css";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const id = useId();
  return (
    <section className={`${sec.section} ${sec.soft}`} aria-labelledby="faq-titulo">
      <div className={`container ${s.grid}`}>
        <Reveal className={s.aside}>
          <span className={sec.kicker}>Dúvidas frequentes</span>
          <h2 id="faq-titulo" className={sec.title}>
            Perguntas frequentes
          </h2>
          <p className={sec.subtitle}>Não encontrou o que procurava? Nossa equipe responde rapidinho pelo WhatsApp.</p>
          <a
            className="btn btn-whatsapp"
            href={whatsappLink("Olá! Tenho uma dúvida sobre os uniformes.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={18} /> Tirar dúvidas no WhatsApp
          </a>
        </Reveal>

        <Reveal delay={80}>
          <ul className={s.list}>
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <li key={f.q} className={s.item} data-open={isOpen || undefined}>
                  <h3>
                    <button
                      type="button"
                      id={`${id}-q${i}`}
                      aria-expanded={isOpen}
                      aria-controls={`${id}-a${i}`}
                      className={s.question}
                      onClick={() => setOpen(isOpen ? null : i)}
                    >
                      <span>{f.q}</span>
                      <span className={s.plus} aria-hidden>
                        <Plus size={18} />
                      </span>
                    </button>
                  </h3>
                  <div id={`${id}-a${i}`} role="region" aria-labelledby={`${id}-q${i}`} className={s.answer} inert={!isOpen}>
                    <div>
                      <p>{f.a}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
