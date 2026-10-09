import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Church,
  Factory,
  GraduationCap,
  HardHat,
  HeartPulse,
  PartyPopper,
  Sparkles,
  Store,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { SafeImage } from "@/components/ui/primitives";
import { Marquee } from "./Marquee";
import { Rail } from "./Rail";
import { Reveal } from "./Reveal";
import sec from "./section.module.css";
import s from "./Segments.module.css";

const segments: { slug: string; icon: LucideIcon; name: string; text: string; href: string }[] = [
  { slug: "saude", icon: HeartPulse, name: "Saúde", text: "Jalecos para clínicas, salões e laboratórios", href: "/loja?categoria=jalecos" },
  { slug: "industria", icon: Factory, name: "Indústria", text: "Brim, operacional e alta visibilidade", href: "/loja?categoria=operacional" },
  { slug: "alimentacao", icon: UtensilsCrossed, name: "Alimentação", text: "Dólmãs e peças fáceis de lavar", href: "/loja?categoria=alimenticia" },
  { slug: "educacao", icon: GraduationCap, name: "Educação", text: "Camisetas e moletons para escolas e turmas", href: "/loja?categoria=camisetas" },
  { slug: "igrejas", icon: Church, name: "Igrejas", text: "Camisetas para ministérios, retiros e eventos", href: "/loja?categoria=camisetas" },
  { slug: "eventos", icon: PartyPopper, name: "Eventos", text: "Corridas, confraternizações e ações de marca", href: "/loja?categoria=camisetas" },
  { slug: "comercio", icon: Store, name: "Comércio", text: "Polos para atendimento, lojas e equipes", href: "/loja?categoria=polos" },
];

/** Tipos de cliente (marcas genéricas, sem nomes reais) para a faixa animada. */
const clientTypes: { icon: LucideIcon; name: string }[] = [
  { icon: HeartPulse, name: "Clínicas" },
  { icon: HardHat, name: "Construtoras" },
  { icon: UtensilsCrossed, name: "Restaurantes" },
  { icon: GraduationCap, name: "Escolas" },
  { icon: Church, name: "Igrejas" },
  { icon: Truck, name: "Transportadoras" },
  { icon: Store, name: "Varejo" },
  { icon: Factory, name: "Indústrias" },
  { icon: Building2, name: "Escritórios" },
  { icon: PartyPopper, name: "Eventos" },
];

export function Segments() {
  return (
    <section className={s.wrap} aria-labelledby="segmentos-titulo">
      <span className={s.bg} aria-hidden />
      <div className="container">
        <Reveal className={sec.headRow}>
          <div>
            <span className={`${sec.kicker} ${s.kicker}`}>Segmentos atendidos</span>
            <h2 id="segmentos-titulo" className={sec.title}>
              Uniformes para todo tipo de equipe
            </h2>
            <p className={`${sec.subtitle} ${s.sub}`}>
              Conhecemos a rotina de cada segmento e indicamos o tecido e o modelo certos para o seu dia a dia.
            </p>
          </div>
          <Link href="/sob-medida" className={`btn btn-accent ${s.headCta}`}>
            <Sparkles size={16} /> Outro segmento? Fale com a gente
          </Link>
        </Reveal>

        <Reveal delay={80}>
          <Rail label="Segmentos atendidos" itemWidth="clamp(220px, 68vw, 280px)" columns={[4, 5, 7]}>
            {segments.map(({ slug, icon: Icon, name, text, href }) => (
              <Link key={slug} href={href} className={s.card}>
                <SafeImage src={`/images/sections/segment-${slug}.webp`} alt="" className={s.media} />
                <span className={s.shade} aria-hidden />
                <span className={s.icon} aria-hidden>
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <span className={s.body}>
                  <strong>{name}</strong>
                  <small>{text}</small>
                </span>
                <span className={s.go} aria-hidden>
                  <ArrowUpRight size={18} />
                </span>
              </Link>
            ))}
          </Rail>
        </Reveal>
      </div>

      <div className={s.marquee}>
        <Marquee label="Tipos de clientes que vestem a Expressão" tone="plain" speed={45}>
          {clientTypes.map(({ icon: Icon, name }) => (
            <span key={name} className={s.logo}>
              <Icon size={22} strokeWidth={1.6} /> {name}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
