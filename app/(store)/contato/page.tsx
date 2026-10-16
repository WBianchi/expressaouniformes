import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock, Instagram, Mail, MapPin, MessageCircle, Navigation, Phone, type LucideIcon } from "lucide-react";
import { company, whatsappLink } from "@/lib/catalog";
import { ContactForm } from "./ContactForm";
import s from "./contato.module.css";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a Expressão Uniformes pelo WhatsApp, e-mail ou telefone. Compra online de uniformes com a sua logo e orçamentos para empresas.",
  alternates: { canonical: "/contato" },
};

const phoneHref = `tel:+${company.phone.replace(/\D/g, "")}`;

const channels: { icon: LucideIcon; label: string; value: string; hint: string; href?: string; external?: boolean; tone: string }[] = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "Atendimento e orçamentos",
    hint: "Resposta mais rápida",
    href: whatsappLink("Olá! Vim pelo site e gostaria de atendimento."),
    external: true,
    tone: "whatsapp",
  },
  { icon: Mail, label: "E-mail", value: company.email, hint: "Para briefings e arquivos", href: `mailto:${company.email}`, tone: "brand" },
  { icon: Phone, label: "Telefone", value: company.phone, hint: "Fale com a nossa equipe", href: phoneHref, tone: "cyan" },
  { icon: Clock, label: "Horário", value: company.hours, hint: "Exceto feriados", tone: "gold" },
];

export default function ContactPage() {
  return (
    <>
      <header className={s.hero}>
        <span className={s.heroBg} aria-hidden />
        <div className="container">
          <nav aria-label="Trilha de navegação" className={s.crumbs}>
            <Link href="/">Início</Link>
            <span aria-hidden>/</span>
            <span aria-current="page">Contato</span>
          </nav>
          <span className={s.kicker}>Direto com quem faz</span>
          <h1>Vamos vestir a sua equipe?</h1>
          <p>Tire dúvidas sobre modelos, tecidos, quantidades e prazos, ou peça um orçamento sem compromisso. Nosso time responde em horário comercial.</p>
        </div>
      </header>

      <section className={`container ${s.layout}`}>
        <div className={s.side}>
          <ul className={s.channels}>
            {channels.map(({ icon: Icon, label, value, hint, href, external, tone }) => {
              const inner = (
                <>
                  <span className={s.chIcon} data-tone={tone}>
                    <Icon size={22} strokeWidth={1.75} />
                  </span>
                  <span className={s.chBody}>
                    <small>{label}</small>
                    <b>{value}</b>
                    <span>{hint}</span>
                  </span>
                  {href && <ArrowUpRight size={18} className={s.chArrow} aria-hidden />}
                </>
              );
              return (
                <li key={label}>
                  {href ? (
                    <a className={s.channel} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {inner}
                    </a>
                  ) : (
                    <div className={s.channel}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className={s.map}>
            <span className={s.mapGrid} aria-hidden />
            <span className={s.road} data-r="1" aria-hidden />
            <span className={s.road} data-r="2" aria-hidden />
            <span className={s.road} data-r="3" aria-hidden />
            <span className={s.pin} aria-hidden>
              <MapPin size={26} strokeWidth={2} />
              <span className={s.pulse} />
            </span>
            <div className={s.mapCard}>
              <span className={s.mapIcon}>
                <Navigation size={18} />
              </span>
              <div>
                <b>Fábrica Expressão Uniformes</b>
                <small>{company.address}</small>
              </div>
              <a
                className="btn btn-sm btn-outline"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.name)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver no mapa
              </a>
            </div>
          </div>

          <a className={s.insta} href={company.instagram} target="_blank" rel="noopener noreferrer">
            <Instagram size={20} strokeWidth={1.75} />
            <span>
              <b>Siga no Instagram</b>
              <small>Bastidores da fábrica e novos modelos</small>
            </span>
            <ArrowUpRight size={18} aria-hidden />
          </a>
        </div>

        <ContactForm />
      </section>
    </>
  );
}
