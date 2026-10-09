import { ArrowRight, BadgeCheck, Factory, Handshake, MessageCircle, Palette, Ruler, Truck } from "lucide-react";
import { whatsappLink } from "@/lib/catalog";
import { SafeImage } from "@/components/ui/primitives";
import s from "./Custom.module.css";

const benefits = [
  { icon: Handshake, title: "Consultor dedicado", text: "Uma pessoa acompanha o projeto do briefing à entrega." },
  { icon: Palette, title: "Identidade fiel", text: "Cores, frisos e acabamentos alinhados ao manual da sua marca." },
  { icon: Factory, title: "Produção própria", text: "Controle de qualidade em cada etapa, sem intermediários." },
  { icon: Ruler, title: "Grade sob medida", text: "Modelagens masculina e feminina com tabela de medidas." },
  { icon: BadgeCheck, title: "Amostra antes do lote", text: "Você aprova o protótipo físico antes da produção." },
  { icon: Truck, title: "Entrega para todo o Brasil", text: "Envio por transportadora com rastreio e prazo combinado." },
];

const flow = [
  { title: "Briefing", text: "Você monta a peça aqui e envia pelo WhatsApp." },
  { title: "Consultoria", text: "Ajustamos tecido, modelagem e orçamento." },
  { title: "Amostra", text: "Produzimos o protótipo para validação." },
  { title: "Aprovação", text: "Você aprova layout, cores e grade." },
  { title: "Produção", text: "Corte, costura, personalização e revisão." },
  { title: "Entrega", text: "Embalagem por colaborador e envio." },
];

const photos = [
  { src: "/images/sections/team-corporate.webp", alt: "Equipe corporativa vestindo uniformes sob medida", caption: "Equipes com identidade" },
  { src: "/images/sections/embroidery.webp", alt: "Bordado de logotipo em polo", caption: "Bordado de precisão" },
  { src: "/images/sections/quality-fabric.webp", alt: "Detalhe de tecido de alta qualidade", caption: "Tecidos selecionados" },
];

const delay = (i: number) => ({ "--reveal-delay": `${i * 70}ms` }) as React.CSSProperties;

export function EnterpriseSection() {
  return (
    <section id="empresas" className={s.enterprise} aria-labelledby="empresas-title">
      <div className="container">
        <div className={s.entIntro}>
          <div className={s.entHead} data-reveal>
            <span className={s.eyebrow}>Para empresas</span>
            <h2 id="empresas-title">Atendimento consultivo do briefing à entrega</h2>
            <p>
              Uniforme é parte da sua marca. Por isso a produção sob medida começa com uma conversa: entendemos a rotina da equipe, o
              clima, as normas da operação e a identidade visual antes de propor a peça ideal.
            </p>
          </div>
          <div className={s.mosaic}>
            {photos.map((p, i) => (
              <figure key={p.src} className={s.photo} data-reveal style={delay(i + 1)}>
                <SafeImage src={p.src} alt={p.alt} />
                <figcaption>{p.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <ul className={s.benefits}>
          {benefits.map(({ icon: Icon, title, text }, i) => (
            <li key={title} data-reveal style={delay(i)}>
              <Icon size={22} strokeWidth={1.75} />
              <strong>{title}</strong>
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <ol className={s.flow} aria-label="Etapas do atendimento">
          {flow.map((f, i) => (
            <li key={f.title} data-reveal style={delay(i)}>
              <strong>{f.title}</strong>
              <span>{f.text}</span>
            </li>
          ))}
        </ol>
        <div className={s.entCta} data-reveal>
          <a href="#montar" className="btn btn-accent btn-lg">
            Montar meu uniforme <ArrowRight size={18} />
          </a>
          <a
            href={whatsappLink("Olá! Quero falar com um consultor sobre uniformes sob medida para minha empresa.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-lg"
          >
            <MessageCircle size={18} /> Falar com um consultor
          </a>
        </div>
      </div>
    </section>
  );
}
