import Link from "next/link";
import { ArrowRight, Building2, Layers, PartyPopper, type LucideIcon } from "lucide-react";
import { BannerImage } from "./BannerImage";
import { Reveal } from "./Reveal";
import s from "./PromoBanners.module.css";

const promos: {
  id: string;
  icon: LucideIcon;
  kicker: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  tone: "brand" | "gold" | "cyan";
}[] = [
  {
    id: "promo-empresas",
    icon: Building2,
    kicker: "Para empresas",
    title: "Uniformes que fortalecem a sua marca",
    text: "Projetos sob medida com consultoria, amostra e produção própria.",
    cta: "Desenvolver projeto",
    href: "/sob-medida",
    tone: "brand",
  },
  {
    id: "promo-eventos",
    icon: PartyPopper,
    kicker: "Eventos e igrejas",
    title: "Camisetas a partir de 5 peças",
    text: "Do retiro à corrida, com a arte do seu grupo.",
    cta: "Ver camisetas",
    href: "/loja?categoria=camisetas",
    tone: "gold",
  },
  {
    id: "promo-kit-completo",
    icon: Layers,
    kicker: "Kit completo",
    title: "Polo, calça e jaleco no mesmo pedido",
    text: "Vista toda a equipe com um padrão só.",
    cta: "Montar o kit",
    href: "/loja?tipo=stock",
    tone: "cyan",
  },
];

export function PromoBanners() {
  return (
    <section className={s.wrap} aria-label="Ofertas e destaques">
      <div className={`container ${s.grid}`}>
        {promos.map(({ id, icon: Icon, kicker, title, text, cta, href, tone }, i) => (
          <Reveal key={id} delay={i * 90} className={s.cell}>
            <Link href={href} className={s.banner}>
              <BannerImage src={`/images/banners/${id}.webp`} alt="" tone={tone} className={s.media} />
              <span className={s.scrim} aria-hidden />
              <span className={s.content}>
                <span className={s.kicker}>
                  <Icon size={14} /> {kicker}
                </span>
                <strong className={s.title}>{title}</strong>
                <span className={s.text}>{text}</span>
                <span className={s.cta}>
                  {cta} <ArrowRight size={16} />
                </span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
