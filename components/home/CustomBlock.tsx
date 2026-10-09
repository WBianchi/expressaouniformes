import Link from "next/link";
import { ArrowRight, Check, Headset, PencilRuler, Settings2 } from "lucide-react";
import { customProducts, whatsappLink } from "@/lib/catalog";
import { SafeImage } from "@/components/ui/primitives";
import { Rail } from "./Rail";
import { Reveal } from "./Reveal";
import sec from "./section.module.css";
import s from "./CustomBlock.module.css";

const checklist = [
  "Modelagem personalizada",
  "Escolha de tecidos e cores",
  "Gola, punho, friso e botões",
  "Recortes e detalhes especiais",
  "Atendimento consultivo",
];

export function CustomBlock() {
  return (
    <section id="sob-medida" className={sec.section} aria-labelledby="sob-medida-titulo">
      <div className="container">
        <div className={s.panel}>
          <span className={s.bg} aria-hidden />
          <Reveal className={s.head}>
            <div>
              <span className={s.badge}>
                <PencilRuler size={14} /> Produção sob medida
              </span>
              <h2 id="sob-medida-titulo" className={sec.title}>
                Modelos personalizados para sua empresa
              </h2>
              <p className={sec.subtitle}>
                Desenvolvemos uniformes exclusivos com tecidos, cores e acabamentos de acordo com a necessidade da sua operação. Pedidos a partir de 30 peças.
              </p>
            </div>
            <div className={s.figure}>
              <SafeImage src="/images/sections/team-corporate.webp" alt="Equipe corporativa vestindo uniformes sob medida" className={s.figureImg} />
              <span className={s.figureShade} aria-hidden />
            <aside className={s.checklist} aria-label="O que você pode personalizar">
              <span className={s.gear} aria-hidden>
                <Settings2 size={26} strokeWidth={1.6} />
              </span>
              <ul>
                {checklist.map((item) => (
                  <li key={item}>
                    <span className={s.check}>
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </aside>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <Rail label="Modelos sob medida" itemWidth="clamp(200px, 60vw, 230px)" gridFrom="lg" columns={[5, 5, 5]}>
              {customProducts.map((p) => (
                <Link key={p.slug} href={`/sob-medida?modelo=${p.slug}`} className={s.card}>
                  <span className={s.media}>
                    <SafeImage src={p.image} alt={p.name} />
                  </span>
                  <span className={s.body}>
                    <strong>{p.name}</strong>
                    <small>{p.short}</small>
                    {p.options && (
                      <span className={s.opts}>
                        {p.options.slice(0, 3).map((o) => (
                          <span key={o}>{o}</span>
                        ))}
                      </span>
                    )}
                  </span>
                  <span className={s.more}>
                    Desenvolver <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </Rail>
          </Reveal>

          <Reveal delay={120} className={s.actions}>
            <Link href="/sob-medida" className="btn btn-primary btn-lg">
              Desenvolver meu uniforme <ArrowRight size={18} />
            </Link>
            <a
              href={whatsappLink("Olá! Quero falar com um consultor para criar um modelo de uniforme sob medida.")}
              target="_blank"
              rel="noopener noreferrer"
              className={s.consultant}
            >
              <span className={s.consultantIcon}>
                <Headset size={22} strokeWidth={1.75} />
              </span>
              <span>
                <b>Falar com um consultor</b>
                <small>pelo WhatsApp, para criar seu modelo</small>
              </span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
