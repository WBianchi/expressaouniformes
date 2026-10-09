import { Factory, FileCheck, QrCode, Shirt, Sparkles, Truck } from "lucide-react";
import { Marquee } from "./Marquee";
import { Reveal } from "./Reveal";
import s from "./BenefitsBar.module.css";

const items = [
  { icon: Factory, title: "Produção própria", text: "Fábrica com controle de ponta a ponta" },
  { icon: Truck, title: "Entrega para todo o Brasil", text: "Envio rastreado até a sua porta" },
  { icon: Shirt, title: "A partir de 5 peças", text: "Ideal para equipes, eventos e igrejas" },
  { icon: QrCode, title: "5% off no Pix", text: "Desconto aplicado no checkout" },
  { icon: FileCheck, title: "Aprovação da arte online", text: "Você aprova o layout antes da produção" },
];

export function BenefitsBar() {
  return (
    <section className={s.wrap} aria-label="Vantagens de comprar com a Expressão">
      <div className="container">
        <Reveal>
          <ul className={s.list}>
            {items.map(({ icon: Icon, title, text }) => (
              <li key={title} className={s.item}>
                <span className={s.icon}>
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

const strip = [
  "Produção própria",
  "Entrega para todo o Brasil",
  "A partir de 5 peças",
  "5% de desconto no Pix",
  "Aprovação da arte online",
  "Bordado, DTF, silk e sublimação",
  "Até 6x sem juros no cartão",
  "Sob medida a partir de 30 peças",
];

/** Faixa navy com rolagem infinita reforçando as vantagens. */
export function BenefitsMarquee() {
  return (
    <Marquee label="Vantagens da Expressão Uniformes" tone="navy" speed={50}>
      {strip.map((t) => (
        <span key={t} className={s.stripItem}>
          <Sparkles size={16} aria-hidden /> {t}
        </span>
      ))}
    </Marquee>
  );
}
