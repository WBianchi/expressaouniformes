"use client";
import Link from "next/link";
import { ArrowRight, Award, CalendarClock, Factory, ScissorsLineDashed, ShieldCheck, type LucideIcon } from "lucide-react";
import { SafeImage } from "@/components/ui/primitives";
import { useParallax } from "./motion";
import { Reveal } from "./Reveal";
import sec from "./section.module.css";
import s from "./About.module.css";

const pillars: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Factory,
    title: "Fábrica própria",
    text: "Corte, costura e personalização sob o mesmo teto. Sem intermediários, com controle de cada etapa.",
  },
  {
    icon: ShieldCheck,
    title: "Qualidade conferida",
    text: "Tecidos selecionados, costuras reforçadas e inspeção peça a peça antes do envio.",
  },
  {
    icon: CalendarClock,
    title: "Prazos combinados",
    text: "Cronograma claro desde a aprovação da arte, com acompanhamento do pedido pela sua conta.",
  },
];

export function About() {
  const ref = useParallax<HTMLDivElement>(0.08);
  return (
    <section id="sobre" className={sec.section} aria-labelledby="sobre-titulo">
      <div className={`container ${s.grid}`}>
        <Reveal className={s.visual}>
          <div ref={ref} className={s.stage}>
            <span className={s.pattern} aria-hidden />
            <div className={s.main}>
              <SafeImage src="/images/sections/about-factory.webp" alt="Equipe de costura trabalhando na fábrica da Expressão Uniformes" className={s.mainImg} />
            </div>
            <div className={`${s.thumb} ${s.t1}`}>
              <SafeImage src="/images/sections/quality-fabric.webp" alt="Detalhe da trama de tecido" />
            </div>
            <div className={`${s.thumb} ${s.t2}`}>
              <SafeImage src="/images/sections/embroidery.webp" alt="Bordado de logo em polo" />
            </div>
            <div className={s.badge}>
              <span className={s.badgeIcon}>
                <Award size={22} />
              </span>
              <span>
                <b>Acabamento premium</b>
                <small>bordado, DTF, silk e sublimação</small>
              </span>
            </div>
            <div className={s.chip}>
              <ScissorsLineDashed size={16} /> Produção própria
            </div>
          </div>
        </Reveal>

        <Reveal delay={100} className={s.copy}>
          <span className={sec.kicker}>Sobre nós</span>
          <h2 id="sobre-titulo" className={sec.title}>
            Uma fábrica de uniformes que entende de marca
          </h2>
          <p className={sec.subtitle}>
            A Expressão Uniformes une a agilidade de uma loja online à qualidade de uma confecção própria. Atendemos empresas de todos os portes, além de
            igrejas, escolas, eventos e grupos que querem vestir a mesma identidade.
          </p>
          <ul className={s.pillars}>
            {pillars.map(({ icon: Icon, title, text }, i) => (
              <Reveal as="li" key={title} delay={160 + i * 90}>
                <span className={s.icon}>
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <span>
                  <b>{title}</b>
                  <small>{text}</small>
                </span>
              </Reveal>
            ))}
          </ul>
          <div className={s.actions}>
            <Link href="/contato" className="btn btn-primary btn-lg">
              Fale com a gente <ArrowRight size={18} />
            </Link>
            <Link href="/loja" className="btn btn-outline btn-lg">
              Conhecer o catálogo
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
