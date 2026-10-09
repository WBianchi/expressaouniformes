import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { categories, products } from "@/lib/catalog";
import { CategoryIcon, SafeImage } from "@/components/ui/primitives";
import { Rail } from "./Rail";
import { Reveal } from "./Reveal";
import sec from "./section.module.css";
import s from "./CategoryCarousel.module.css";

const counts = Object.fromEntries(categories.map((c) => [c.slug, products.filter((p) => p.category === c.slug).length]));

export function CategoryCarousel() {
  return (
    <section className={`${sec.section} ${sec.soft}`} aria-labelledby="categorias-titulo">
      <div className={s.pattern} aria-hidden />
      <div className="container">
        <Reveal className={sec.headRow}>
          <div>
            <span className={sec.kicker}>Categorias</span>
            <h2 id="categorias-titulo" className={sec.title}>
              Uniformes para cada rotina
            </h2>
            <p className={sec.subtitle}>Do escritório à indústria: encontre a linha ideal para a sua equipe.</p>
          </div>
          <Link href="/loja" className={sec.link}>
            Ver todo o catálogo <ArrowRight size={16} />
          </Link>
        </Reveal>

        <Reveal delay={80}>
          <Rail label="Categorias de uniformes" itemWidth="clamp(200px, 62vw, 260px)" columns={[4, 5, 6]}>
            {categories.map((c) => (
              <Link key={c.slug} href={`/loja?categoria=${c.slug}`} className={s.card}>
                <SafeImage src={c.image} alt="" className={s.media} />
                <span className={s.shade} aria-hidden />
                <span className={s.icon} aria-hidden>
                  <CategoryIcon name={c.icon} size={18} />
                </span>
                <span className={s.go} aria-hidden>
                  <ArrowUpRight size={18} />
                </span>
                <span className={s.body}>
                  <strong>{c.name}</strong>
                  <small>{c.description}</small>
                  <em>
                    {counts[c.slug]} {counts[c.slug] === 1 ? "modelo" : "modelos"}
                  </em>
                </span>
              </Link>
            ))}
          </Rail>
        </Reveal>
      </div>
    </section>
  );
}
