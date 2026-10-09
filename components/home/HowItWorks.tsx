"use client";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CloudUpload, PackageCheck, Shirt, type LucideIcon } from "lucide-react";
import { SafeImage } from "@/components/ui/primitives";
import { useInView } from "./useInView";
import sec from "./section.module.css";
import s from "./HowItWorks.module.css";

const steps: { icon: LucideIcon; title: string; text: string; tag: string }[] = [
  {
    icon: Shirt,
    title: "Escolha o modelo",
    text: "Selecione a peça, a cor e a grade de tamanhos. Pedido mínimo de 5 peças, somando todos os tamanhos.",
    tag: "Na loja",
  },
  {
    icon: CloudUpload,
    title: "Envie a sua logo",
    text: "Indique as posições (frente, costas ou manga) e anexe o arquivo. Finalize com Pix, boleto ou cartão.",
    tag: "No checkout",
  },
  {
    icon: BadgeCheck,
    title: "Aprove o layout",
    text: "Nossa equipe monta a arte sobre a peça e você aprova direto no site, em Minha conta › Pedidos.",
    tag: "Online",
  },
  {
    icon: PackageCheck,
    title: "Produção e entrega",
    text: "Com a arte aprovada, produzimos na nossa fábrica e enviamos com rastreio para todo o Brasil.",
    tag: "Fábrica própria",
  },
];

export function HowItWorks() {
  const [ref, inView] = useInView<HTMLOListElement>({ threshold: 0.3 });
  return (
    <section id="como-funciona" className={`${sec.section} ${sec.soft} ${s.wrap}`} aria-labelledby="como-funciona-titulo">
      <div className="container">
        <div className={sec.center}>
          <span className={sec.kicker}>Como funciona</span>
          <h2 id="como-funciona-titulo" className={sec.title}>
            Da escolha à entrega em 4 passos
          </h2>
          <p className={sec.subtitle}>Um processo simples e transparente: você acompanha cada etapa do pedido pela sua conta.</p>
        </div>

        <ol ref={ref} className={s.timeline} data-inview={inView || undefined}>
          <li className={s.line} aria-hidden role="presentation">
            <span className={s.fill} />
          </li>
          {steps.map(({ icon: Icon, title, text, tag }, i) => (
            <li key={title} className={s.step} style={{ "--i": i } as React.CSSProperties}>
              <span className={s.node}>
                <Icon size={24} strokeWidth={1.75} />
                <span className={s.num}>{i + 1}</span>
              </span>
              <div className={s.body}>
                <span className={s.media}>
                  <SafeImage src={`/images/sections/how-${i + 1}.webp`} alt="" />
                  <span className={s.tag}>{tag}</span>
                </span>
                <div className={s.text}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className={s.cta}>
          <Link href="/loja?tipo=stock" className="btn btn-accent btn-lg">
            Começar meu pedido <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
