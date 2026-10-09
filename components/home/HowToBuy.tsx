"use client";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CloudUpload,
  Headset,
  MessageCircle,
  Package,
  Palette,
  PencilRuler,
  Shirt,
  Truck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { getProduct, whatsappLink } from "@/lib/catalog";
import { SafeImage } from "@/components/ui/primitives";
import { tiltHandlers } from "./motion";
import { Reveal } from "./Reveal";
import sec from "./section.module.css";
import s from "./HowToBuy.module.css";

type Step = { icon: LucideIcon; label: string };

const stockSteps: Step[] = [
  { icon: Shirt, label: "Escolha modelo e cor" },
  { icon: CloudUpload, label: "Envie a sua logo" },
  { icon: BadgeCheck, label: "Aprove o layout online" },
  { icon: Truck, label: "Receba em casa" },
];
const customSteps: Step[] = [
  { icon: PencilRuler, label: "Monte a peça ideal" },
  { icon: Palette, label: "Tecidos, cores e acabamentos" },
  { icon: Headset, label: "Consultoria pelo WhatsApp" },
  { icon: Package, label: "Produção a partir de 30 peças" },
];

const collage = ["polo-pv-basica", "camiseta-algodao-basica", "polo-piquet-basica"].map((slug) => getProduct(slug)!).filter(Boolean);
const tilt = tiltHandlers(4);

export function HowToBuy() {
  return (
    <section className={sec.section} aria-labelledby="como-comprar">
      <div className="container">
        <Reveal className={sec.center}>
          <span className={sec.kicker}>Duas formas de comprar</span>
          <h2 id="como-comprar" className={sec.title}>
            Escolha como você quer vestir sua equipe
          </h2>
          <p className={sec.subtitle}>
            Compre online peças em estoque prontas para receber a sua logo, ou desenvolva com a gente um uniforme exclusivo para a sua empresa.
          </p>
        </Reveal>

        <div className={s.grid}>
          <Reveal delay={80}>
            <article className={s.card} data-tone="success" {...tilt}>
              <span className={s.glow} aria-hidden />
              <div className={s.visual} data-kind="stock" aria-hidden>
                {collage.map((p, i) => (
                  <span key={p.slug} className={s.piece} style={{ "--i": i } as React.CSSProperties}>
                    <SafeImage src={p.image} alt="" />
                  </span>
                ))}
                <span className={s.floatChip} data-pos="a">
                  <Zap size={14} /> Pronto em poucos dias
                </span>
                <span className={s.floatChip} data-pos="b">
                  A partir de <b>5 peças</b>
                </span>
              </div>
              <header className={s.head}>
                <span className={s.badge}>
                  <Zap size={14} /> Pronta para personalizar
                </span>
                <span className={s.bigIcon} aria-hidden>
                  <Package size={30} strokeWidth={1.6} />
                </span>
              </header>
              <h3>Peças em estoque, com a sua logo</h3>
              <p className={s.desc}>
                Compra 100% online a partir de <b>5 peças</b>. Pague com Pix, boleto ou cartão e acompanhe tudo pela sua conta.
              </p>
              <ol className={s.steps}>
                {stockSteps.map(({ icon: Icon, label }, i) => (
                  <li key={label} style={{ "--i": i } as React.CSSProperties}>
                    <span className={s.stepIcon}>
                      <Icon size={18} strokeWidth={1.75} />
                    </span>
                    <span className={s.stepNum}>0{i + 1}</span>
                    <span className={s.stepLabel}>{label}</span>
                  </li>
                ))}
              </ol>
              <div className={s.foot}>
                <Link href="/loja?tipo=stock" className={`btn btn-lg ${s.ctaSuccess}`}>
                  Ver peças em estoque <ArrowRight size={18} />
                </Link>
                <span className={s.note}>Pix com 5% de desconto</span>
              </div>
            </article>
          </Reveal>

          <Reveal delay={180}>
            <article className={s.card} data-tone="brand" {...tilt}>
              <span className={s.glow} aria-hidden />
              <div className={s.visual} data-kind="custom" aria-hidden>
                <SafeImage src="/images/sections/custom-hero.webp" alt="" className={s.photo} />
                <span className={s.photoShade} />
                <span className={s.floatChip} data-pos="a">
                  <Palette size={14} /> Tecidos, golas e frisos
                </span>
                <span className={s.floatChip} data-pos="b">
                  Mínimo de <b>30 peças</b>
                </span>
              </div>
              <header className={s.head}>
                <span className={s.badge}>
                  <Building2 size={14} /> Produção sob medida
                </span>
                <span className={s.bigIcon} aria-hidden>
                  <PencilRuler size={30} strokeWidth={1.6} />
                </span>
              </header>
              <h3>Um uniforme exclusivo para a sua empresa</h3>
              <p className={s.desc}>
                Para empresas e atacado a partir de <b>30 peças</b>. Você define cada detalhe e um consultor acompanha o projeto do briefing à entrega.
              </p>
              <ol className={s.steps}>
                {customSteps.map(({ icon: Icon, label }, i) => (
                  <li key={label} style={{ "--i": i } as React.CSSProperties}>
                    <span className={s.stepIcon}>
                      <Icon size={18} strokeWidth={1.75} />
                    </span>
                    <span className={s.stepNum}>0{i + 1}</span>
                    <span className={s.stepLabel}>{label}</span>
                  </li>
                ))}
              </ol>
              <div className={s.foot}>
                <Link href="/sob-medida" className="btn btn-primary btn-lg">
                  Desenvolver meu uniforme <ArrowRight size={18} />
                </Link>
                <a
                  className={`btn btn-outline btn-lg ${s.wa}`}
                  href={whatsappLink("Olá! Quero falar com um consultor sobre uniformes sob medida.")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={18} /> Consultor
                </a>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
