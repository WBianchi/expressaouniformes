import type { Metadata } from "next";
import { ArrowDown, ArrowRight, BadgeCheck, Factory, Handshake, Users } from "lucide-react";
import CustomBuilder from "@/components/custom/CustomBuilder";
import { EnterpriseSection } from "@/components/custom/EnterpriseSection";
import { RevealOnScroll } from "@/components/custom/RevealOnScroll";
import s from "@/components/custom/Custom.module.css";

export const metadata: Metadata = {
  title: "Monte seu uniforme — produção sob medida",
  description:
    "Monte o uniforme da sua empresa do zero: tecido, gola, mangas, friso, cores, extras e logo. Envie o briefing e receba atendimento consultivo pelo WhatsApp. A partir de 30 peças.",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { modelo } = await searchParams;
  const initialModel = typeof modelo === "string" ? modelo : undefined;

  return (
    <>
      <RevealOnScroll />
      <section className={s.hero}>
        {/* foto com fallback: o gradiente de fundo aparece se a imagem não existir */}
        <span className={s.heroImg} style={{ backgroundImage: "url(/images/sections/custom-hero.webp)" }} aria-hidden />
        <span className={s.heroShade} aria-hidden />
        <span className={s.blob} data-v="1" aria-hidden />
        <span className={s.blob} data-v="2" aria-hidden />
        <div className="container">
          <div className={s.heroInner}>
            <span className={s.heroEyebrow}>Produção sob medida · para empresas</span>
            <h1>
              Monte seu <em>uniforme</em>
              <br /> do zero, do seu jeito.
            </h1>
            <p>
              Escolha tecido, gola, mangas, friso, cores e acabamentos, veja a prévia mudar em tempo real e envie o briefing. Um
              consultor continua o atendimento pelo WhatsApp.
            </p>
            <div className={s.heroActions}>
              <a href="#montar" className="btn btn-accent btn-lg">
                Começar agora <ArrowRight size={18} />
              </a>
              <a href="#empresas" className={`btn btn-lg ${s.heroGhost}`}>
                Como funciona <ArrowDown size={17} />
              </a>
            </div>
            <ul className={s.badges}>
              <li style={{ "--i": 0 } as React.CSSProperties}>
                <Users size={15} /> A partir de 30 peças
              </li>
              <li style={{ "--i": 1 } as React.CSSProperties}>
                <Handshake size={15} /> Atendimento consultivo
              </li>
              <li style={{ "--i": 2 } as React.CSSProperties}>
                <BadgeCheck size={15} /> Amostra antes da produção
              </li>
              <li style={{ "--i": 3 } as React.CSSProperties}>
                <Factory size={15} /> Produção própria
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className={`container ${s.section}`}>
        <CustomBuilder initialModel={initialModel} />
      </div>

      <EnterpriseSection />
    </>
  );
}
