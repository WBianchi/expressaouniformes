"use client";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { stockProducts } from "@/lib/catalog";
import { PIX_DISCOUNT } from "@/lib/pricing";
import { useInView, usePrefersReducedMotion } from "./useInView";
import { Reveal } from "./Reveal";
import sec from "./section.module.css";
import s from "./SocialProof.module.css";

const avgRating = stockProducts.reduce((a, p) => a + p.rating, 0) / stockProducts.length;

/** Números baseados nas condições atuais da loja (regras de pedido e pagamento). */
const stats = [
  { value: 5, decimals: 0, suffix: "", unit: "peças", label: "pedido mínimo na pronta-entrega" },
  { value: 30, decimals: 0, suffix: "", unit: "peças", label: "mínimo para produção sob medida" },
  { value: PIX_DISCOUNT * 100, decimals: 0, suffix: "%", unit: "off", label: "de desconto pagando com Pix" },
  { value: avgRating, decimals: 1, suffix: "", unit: "/ 5", label: "nota média dos modelos no catálogo" },
];

const testimonials = [
  {
    initials: "AC",
    role: "Gerente administrativa",
    company: "Clínica odontológica",
    text: "Fizemos os jalecos de toda a equipe pelo site. A aprovação do layout online deixou tudo muito mais rápido e o bordado ficou impecável.",
  },
  {
    initials: "RS",
    role: "Coordenador de operações",
    company: "Indústria metalúrgica",
    text: "O consultor ajudou a definir tecido e faixas refletivas certas para a nossa operação. Recebemos dentro do prazo combinado.",
  },
  {
    initials: "ML",
    role: "Líder de ministério",
    company: "Igreja local",
    text: "Pedimos camisetas para o retiro com poucas peças por tamanho. Atendimento atencioso e o Pix com desconto ajudou no orçamento.",
  },
  {
    initials: "FT",
    role: "Sócio-proprietário",
    company: "Restaurante",
    text: "Os dólmãs são confortáveis e fáceis de lavar. A equipe ficou com uma apresentação muito mais profissional.",
  },
];

function Counter({ value, decimals, run }: { value: number; decimals: number; run: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (reduced) {
      setN(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, value, reduced]);
  return <>{n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}

export function SocialProof() {
  const [ref, inView] = useInView<HTMLUListElement>({ threshold: 0.4 });
  const [i, setI] = useState(0);
  const t = testimonials[i];
  const go = (d: number) => setI((x) => (x + d + testimonials.length) % testimonials.length);

  return (
    <section className={`${sec.section} ${s.wrap}`} aria-labelledby="prova-social-titulo">
      <span className={s.bg} aria-hidden />
      <div className="container">
        <Reveal className={sec.center}>
          <span className={`${sec.kicker} ${s.kicker}`}>Por que a Expressão</span>
          <h2 id="prova-social-titulo" className={`${sec.title} ${s.title}`}>
            Condições pensadas para equipes de todos os tamanhos
          </h2>
        </Reveal>

        <div className={s.layout}>
        <ul ref={ref} className={s.stats}>
          {stats.map((st) => (
            <li key={st.label} className={s.stat}>
              <strong>
                <Counter value={st.value} decimals={st.decimals} run={inView} />
                {st.suffix}
                <small>{st.unit}</small>
              </strong>
              <span>{st.label}</span>
            </li>
          ))}
        </ul>

        <Reveal className={s.testimonials} delay={100}>
          <div className={s.quoteCard} aria-live="polite">
            <Quote size={40} strokeWidth={1.5} className={s.quoteIcon} aria-hidden />
            <div className={s.stars} aria-label="5 de 5 estrelas">
              {Array.from({ length: 5 }, (_, k) => (
                <Star key={k} size={16} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <blockquote key={i} className={s.quote}>
              <p>“{t.text}”</p>
              <footer>
                <span className={s.avatar} aria-hidden>
                  {t.initials}
                </span>
                <span>
                  <b>{t.role}</b>
                  <small>{t.company}</small>
                </span>
              </footer>
            </blockquote>
          </div>
          <div className={s.nav}>
            <button type="button" className={s.navBtn} onClick={() => go(-1)} aria-label="Depoimento anterior">
              <ChevronLeft size={20} />
            </button>
            <div className={s.pips}>
              {testimonials.map((x, k) => (
                <button
                  key={x.initials}
                  type="button"
                  className={s.pip}
                  data-active={k === i || undefined}
                  aria-label={`Depoimento ${k + 1} de ${testimonials.length}`}
                  aria-current={k === i}
                  onClick={() => setI(k)}
                />
              ))}
            </div>
            <button type="button" className={s.navBtn} onClick={() => go(1)} aria-label="Próximo depoimento">
              <ChevronRight size={20} />
            </button>
          </div>
          <p className={s.disclaimer}>
            Depoimentos ilustrativos, apresentados como exemplo. Os números acima refletem as condições atuais da loja e a média de avaliações do catálogo demonstrativo.
          </p>
        </Reveal>
        </div>
      </div>
    </section>
  );
}
