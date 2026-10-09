"use client";
import Link from "next/link";
import { ArrowRight, Boxes, Zap } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { categories, stockProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ui/ProductCard";
import { CategoryIcon } from "@/components/ui/primitives";
import { Rail } from "./Rail";
import { Reveal } from "./Reveal";
import sec from "./section.module.css";
import s from "./StockShowcase.module.css";

const titles: Record<string, string> = {
  operacional: "Uniformes operacionais",
  alimenticia: "Peças para a área alimentícia",
  "alta-visibilidade": "Peças de alta visibilidade",
};

const tabs = [
  { slug: "todos", name: "Todos", icon: "Shirt", plural: "Modelos" },
  ...categories
    .filter((c) => stockProducts.some((p) => p.category === c.slug))
    .map((c) => ({ slug: c.slug, name: c.name, icon: c.icon, plural: titles[c.slug] ?? c.name })),
];

export function StockShowcase() {
  const [active, setActive] = useState("polos");
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const list = active === "todos" ? stockProducts : stockProducts.filter((p) => p.category === active);
  const current = tabs.find((t) => t.slug === active) ?? tabs[0];

  const onKey = (e: KeyboardEvent, i: number) => {
    let n = i;
    if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = tabs.length - 1;
    else return;
    e.preventDefault();
    setActive(tabs[n].slug);
    refs.current[n]?.focus();
  };

  return (
    <section className={sec.section} aria-labelledby={`${id}-title`}>
      <div className="container">
        <Reveal className={s.head}>
          <div>
            <span className={s.badge}>
              <Zap size={14} /> Pronta para personalizar
            </span>
            <h2 id={`${id}-title`} className={sec.title}>
              {current.plural} disponíveis em estoque
            </h2>
            <p className={sec.subtitle}>Modelos básicos, ideais para personalizar com a sua logo. Produção rápida após a aprovação da arte.</p>
          </div>
          <aside className={s.info}>
            <span className={s.infoIcon}>
              <Boxes size={22} strokeWidth={1.75} />
            </span>
            <p>
              <b>Peças em estoque</b>
              Escolha a cor, a grade de tamanhos e envie sua logo. Pedido mínimo de 5 peças.
            </p>
          </aside>
        </Reveal>

        <Reveal delay={60}>
          <div className={s.tabs} role="tablist" aria-label="Filtrar por categoria">
            {tabs.map((t, i) => {
              const selected = t.slug === active;
              const count = t.slug === "todos" ? stockProducts.length : stockProducts.filter((p) => p.category === t.slug).length;
              return (
                <button
                  key={t.slug}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${id}-tab-${t.slug}`}
                  aria-selected={selected}
                  aria-controls={`${id}-panel`}
                  tabIndex={selected ? 0 : -1}
                  className={s.tab}
                  data-active={selected || undefined}
                  onClick={() => setActive(t.slug)}
                  onKeyDown={(e) => onKey(e, i)}
                >
                  <CategoryIcon name={t.icon} size={16} />
                  {t.name}
                  <span className={s.count}>{count}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${active}`} className={s.panel} key={active}>
          <Rail label={`${current.plural} em estoque`} itemWidth="clamp(230px, 70vw, 272px)">
            {list.map((p, i) => (
              <div key={p.slug} className={s.item} style={{ "--i": i } as React.CSSProperties}>
                <ProductCard product={p} />
              </div>
            ))}
          </Rail>
        </div>

        <div className={s.more}>
          <Link href={active === "todos" ? "/loja?tipo=stock" : `/loja?tipo=stock&categoria=${active}`} className="btn btn-outline">
            Ver todos {active === "todos" ? "os modelos" : `em ${current.name}`} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
