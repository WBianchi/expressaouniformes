import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { stockProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ui/ProductCard";
import { Rail } from "./Rail";
import { Reveal } from "./Reveal";
import sec from "./section.module.css";
import s from "./BestSellers.module.css";

const best = [...stockProducts].sort((a, b) => b.reviews - a.reviews).slice(0, 10);

export function BestSellers() {
  return (
    <section className={`${sec.section} ${sec.tint}`} aria-labelledby="mais-vendidos-titulo">
      <div className="container">
        <Reveal className={sec.headRow}>
          <div>
            <span className={sec.kicker}>
              <TrendingUp size={14} /> Mais vendidos
            </span>
            <h2 id="mais-vendidos-titulo" className={sec.title}>
              Os favoritos de quem já veste a Expressão
            </h2>
            <p className={sec.subtitle}>Os modelos mais avaliados da loja, prontos para receber a sua marca.</p>
          </div>
          <Link href="/loja?tipo=stock" className={sec.link}>
            Ver todos <ArrowRight size={16} />
          </Link>
        </Reveal>

        <Reveal delay={80}>
          <Rail label="Mais vendidos" itemWidth="clamp(230px, 70vw, 272px)" columns={[4, 5, 6]}>
            {best.map((p, i) => (
              <div key={p.slug} className={s.item}>
                <span className={s.rankBox}>
                  <span className={s.rank} aria-label={`${i + 1}º mais vendido`}>
                    {i + 1}
                  </span>
                </span>
                <ProductCard product={p} />
              </div>
            ))}
          </Rail>
        </Reveal>
      </div>
    </section>
  );
}
