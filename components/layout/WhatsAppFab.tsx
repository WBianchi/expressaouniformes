"use client";
import { useEffect, useState } from "react";
import { whatsappLink } from "@/lib/catalog";
import { WhatsAppIcon } from "./icons";
import s from "./WhatsAppFab.module.css";

/** Botão flutuante do WhatsApp; expande o rótulo no hover/foco e uma vez após alguns segundos. */
export function WhatsAppFab() {
  const [peek, setPeek] = useState(false);
  useEffect(() => {
    const show = window.setTimeout(() => setPeek(true), 5000);
    const hide = window.setTimeout(() => setPeek(false), 10000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, []);
  return (
    <a
      className={s.fab}
      data-peek={peek || undefined}
      href={whatsappLink("Olá! Vim pelo site e gostaria de falar com um consultor.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale com um consultor pelo WhatsApp"
    >
      <span className={s.label} aria-hidden>
        <small>Atendimento via WhatsApp</small>
        Fale com um consultor
      </span>
      <span className={s.icon}>
        <WhatsAppIcon size={28} />
      </span>
    </a>
  );
}
