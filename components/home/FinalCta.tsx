"use client";
import Link from "next/link";
import { ArrowRight, FileText, Headset, MessageCircle, Users } from "lucide-react";
import { whatsappLink } from "@/lib/catalog";
import { BannerImage } from "./BannerImage";
import { useParallax } from "./motion";
import { Reveal } from "./Reveal";
import s from "./FinalCta.module.css";

const perks = [
  { icon: Headset, label: "Atendimento especializado" },
  { icon: FileText, label: "Orçamento sem compromisso" },
  { icon: Users, label: "Condições especiais para grandes volumes" },
];

export function FinalCta() {
  const ref = useParallax<HTMLElement>(0.1);
  return (
    <section ref={ref} className={s.wrap} aria-labelledby="cta-final-titulo">
      <BannerImage src="/images/sections/cta-bg.webp" alt="" className={s.media} />
      <span className={s.scrim} aria-hidden />
      <span className={s.shine} aria-hidden />
      <div className={`container ${s.panel}`}>
        <Reveal className={s.text}>
          <span className={s.kicker}>Kit completo para a sua equipe</span>
          <h2 id="cta-final-titulo">Precisa de um uniforme completo?</h2>
          <p>Monte o kit da sua equipe com polos, calças, camisetas, jalecos e muito mais. Atendemos empresas de todos os segmentos.</p>
          <ul className={s.perks}>
            {perks.map(({ icon: Icon, label }) => (
              <li key={label}>
                <Icon size={18} strokeWidth={1.75} /> {label}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={150} className={s.actions}>
          <Link href="/sob-medida" className="btn btn-accent btn-lg">
            Montar meu uniforme <ArrowRight size={18} />
          </Link>
          <a
            href={whatsappLink("Olá! Preciso de um uniforme completo para a minha equipe.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp btn-lg"
          >
            <MessageCircle size={18} /> Chamar no WhatsApp
          </a>
        </Reveal>
      </div>
    </section>
  );
}
