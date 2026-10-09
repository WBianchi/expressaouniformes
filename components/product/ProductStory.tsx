import { BadgeCheck, Factory, Ruler, Scissors } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { SafeImage } from "@/components/ui/primitives";
import s from "./Story.module.css";

const stockSteps = [
  { title: "Você envia a logo", text: "Anexe no pedido ou depois da compra. Aceitamos PNG, JPG, WebP e SVG." },
  { title: "Criamos o layout", text: "Nossa equipe posiciona a arte na peça escolhida, nas posições que você marcou." },
  { title: "Você aprova no site", text: "Confira o layout em Minha conta › Pedidos e aprove ou peça ajustes." },
  { title: "Produzimos e enviamos", text: "Personalização feita na fábrica e entrega para todo o Brasil." },
];
const customSteps = [
  { title: "Briefing do modelo", text: "Conte tecido, cores, acabamentos e quantidade no configurador sob medida." },
  { title: "Consultoria", text: "Um consultor fala com você pelo WhatsApp para ajustar cada detalhe." },
  { title: "Projeto aprovado", text: "Você recebe o layout técnico e o orçamento para aprovação." },
  { title: "Produção própria", text: "Cortamos, costuramos e personalizamos tudo na nossa fábrica." },
];

/** Seções editoriais da single: qualidade/acabamento e passo a passo visual. */
export function ProductStory({ product }: { product: Product }) {
  const steps = product.kind === "stock" ? stockSteps : customSteps;
  return (
    <>
      <section className={`container ${s.quality}`} aria-labelledby="quality-title">
        <div className={s.qualityIntro} data-reveal="">
          <span className={s.eyebrow}>Qualidade e acabamento</span>
          <h2 id="quality-title">Feito para durar no dia a dia da sua equipe</h2>
          <p>
            Cada peça passa por conferência antes de sair da fábrica. Tecido escolhido para o uso real, costuras reforçadas e uma
            personalização que mantém a cor e a definição lavagem após lavagem.
          </p>
          <ul className={s.points}>
            <li><Factory size={18} strokeWidth={1.75} /> Produção própria</li>
            <li><BadgeCheck size={18} strokeWidth={1.75} /> Conferência peça a peça</li>
            <li><Scissors size={18} strokeWidth={1.75} /> Costuras reforçadas</li>
            <li><Ruler size={18} strokeWidth={1.75} /> Grade do {product.sizes[0]} ao {product.sizes[product.sizes.length - 1]}</li>
          </ul>
        </div>
        <figure className={s.qCard} data-reveal="" style={{ "--reveal-delay": "80ms" } as React.CSSProperties}>
          <div className={s.qMedia}><SafeImage src="/images/sections/quality-fabric.webp" alt="Detalhe da trama do tecido" /></div>
          <figcaption>
            <small>Tecido</small>
            <b>{product.fabric}</b>
            <span>{product.features[0]}</span>
          </figcaption>
        </figure>
        <figure className={s.qCard} data-reveal="" style={{ "--reveal-delay": "160ms" } as React.CSSProperties}>
          <div className={s.qMedia}><SafeImage src="/images/sections/embroidery.webp" alt="Bordado de logo em close" /></div>
          <figcaption>
            <small>Personalização</small>
            <b>{product.techniques.join(" · ")}</b>
            <span>Alta definição e cores fiéis à sua marca.</span>
          </figcaption>
        </figure>
      </section>

      <section className={s.how} aria-labelledby="how-title">
        <div className="container">
          <div className={s.howHead} data-reveal="">
            <span className={s.eyebrow}>Passo a passo</span>
            <h2 id="how-title">{product.kind === "stock" ? "Do pedido à entrega, sem complicação" : "Como desenvolvemos o seu modelo"}</h2>
          </div>
          <ol className={s.howList}>
            {steps.map((st, i) => (
              <li key={st.title} data-reveal="" style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}>
                <div className={s.howMedia}>
                  <SafeImage src={`/images/sections/how-${i + 1}.webp`} alt="" />
                  <span className={s.howNum}>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <b>{st.title}</b>
                <p>{st.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
