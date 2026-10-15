"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CloudUpload,
  ClipboardList,
  Headset,
  Package,
  Palette,
  PencilRuler,
  Shirt,
  Truck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { getProduct } from "@/lib/catalog";
import { QuoteGate } from "@/components/custom/QuoteGate";
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
  { icon: ClipboardList, label: "Responda 3 perguntas" },
  { icon: Palette, label: "Tecidos, cores e acabamentos" },
  { icon: Headset, label: "Atendimento com consultor" },
  { icon: Package, label: "Produção a partir de 30 peças" },
];

const collage = ["polo-pv-basica", "camiseta-algodao-basica", "polo-piquet-basica"].map((slug) => getProduct(slug)!).filter(Boolean);
const tilt = tiltHandlers(4);

export function HowToBuy() {
  const [quoteOpen, setQuoteOpen] = useState(false);
  return (
    <section className={sec.section} aria-labelledby="como-comprar">
      <div className="container">
        <Reveal className={sec.center}>
          <span className={sec.kicker}>Duas formas de comprar</span>
          <h2 id="como-comprar" className={sec.title}>
            Escolha como você quer vestir sua equipe
          </h2>
          <p className={sec.subtitle}>
            Compre online uniformes prontos para personalizar com a sua logo, ou solicite um orçamento de uniformes personalizados para a sua empresa.
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
              <h3>Uniformes prontos para personalizar</h3>
              <p className={s.desc}>
                Compra online a partir de <b>cinco peças</b>. Escolha o modelo, envie a sua logo, aprove o layout no site e pague com Pix, boleto ou cartão.
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
                  Personalizar e comprar <ArrowRight size={18} />
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
              <h3>Uniformes personalizados para sua empresa</h3>
              <p className={s.desc}>
                Produção sob medida a partir de <b>30 peças</b>. Responda a um questionário rápido sobre quantidade, equipe e personalizações para falar com um consultor.
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
                <button type="button" className="btn btn-primary btn-lg" onClick={() => setQuoteOpen(true)}>
                  Solicitar orçamento <ArrowRight size={18} />
                </button>
                <span className={s.note} data-tone="brand">
                  Mínimo de 30 peças
                </span>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
      <QuoteGate open={quoteOpen} onOpenChange={setQuoteOpen} />
    </section>
  );
}
