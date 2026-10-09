"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, Droplets, Info, Shirt, Star, ThermometerSun, Wind } from "lucide-react";
import type { Product, Size } from "@/lib/catalog";
import { Rating } from "@/components/ui/primitives";
import s from "./Product.module.css";

type TabId = "descricao" | "caracteristicas" | "tecido" | "medidas" | "avaliacoes";
const tabs: { id: TabId; label: string }[] = [
  { id: "descricao", label: "Descrição" },
  { id: "caracteristicas", label: "Características" },
  { id: "tecido", label: "Tecido e cuidados" },
  { id: "medidas", label: "Tabela de medidas" },
  { id: "avaliacoes", label: "Avaliações" },
];

// medidas ilustrativas (cm)
const tops: Record<Size, [number, number, number]> = {
  PP: [48, 66, 19],
  P: [50, 69, 20],
  M: [53, 72, 21],
  G: [56, 74, 22],
  GG: [59, 76, 23],
  XG: [62, 78, 24],
  XGG: [65, 80, 25],
};
const pants: Record<Size, [number, number, number]> = {
  PP: [70, 94, 100],
  P: [74, 98, 102],
  M: [80, 104, 104],
  G: [86, 110, 106],
  GG: [92, 116, 108],
  XG: [98, 122, 110],
  XGG: [104, 128, 111],
};

const sampleReviews = (p: Product) => {
  const stock = p.kind === "stock";
  return [
    {
      who: "Cliente empresarial · Logística",
      stars: 5,
      text: stock
        ? "Peças com ótimo acabamento e a logo ficou idêntica ao layout aprovado. Processo muito simples pelo site."
        : "O consultor entendeu exatamente o que precisávamos. O modelo ficou com a cara da nossa marca.",
    },
    {
      who: "Igreja · pedido para evento",
      stars: 5,
      text: "Atendimento atencioso e prazo cumprido. A grade mista de tamanhos facilitou muito para vestir todo mundo.",
    },
    {
      who: "Clínica · equipe de recepção",
      stars: 4,
      text: `O tecido (${p.fabric.toLowerCase()}) é confortável e não amassa fácil. Já estamos planejando o próximo pedido.`,
    },
  ];
};

function careFor(p: Product) {
  const f = p.fabric.toLowerCase();
  const cold = /dry|poli|fluores/.test(f);
  return [
    { icon: Droplets, text: cold ? "Lavar à mão ou na máquina em água fria (até 30 °C)." : "Lavar na máquina em água até 40 °C, do avesso." },
    { icon: Wind, text: "Secar à sombra. Evitar secadora para preservar a personalização." },
    { icon: ThermometerSun, text: cold ? "Não passar ferro diretamente sobre a estampa." : "Passar em temperatura média, sem passar sobre bordado ou estampa." },
    { icon: Info, text: "Não usar alvejante à base de cloro." },
  ];
}

export function ProductTabs({ product }: { product: Product }) {
  const [tab, setTab] = useState<TabId>("descricao");
  const base = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const open = (e: Event) => {
      const id = (e as CustomEvent<TabId>).detail;
      if (tabs.some((t) => t.id === id)) setTab(id);
    };
    window.addEventListener("eu:product-tab", open);
    return () => window.removeEventListener("eu:product-tab", open);
  }, []);

  function onKey(e: KeyboardEvent) {
    const i = tabs.findIndex((t) => t.id === tab);
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    setTab(tabs[next].id);
    refs.current[tabs[next].id]?.focus();
  }

  const isPants = product.category === "calcas";
  const table = isPants ? pants : tops;
  const cols = isPants ? ["Cintura", "Quadril", "Comprimento"] : ["Largura (A)", "Comprimento (B)", "Manga (C)"];

  return (
    <section className={s.tabs} id="detalhes" aria-label="Detalhes do produto">
      <div className={s.tabList} role="tablist" aria-label="Informações do produto" onKeyDown={onKey}>
        {tabs.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-${t.id}-tab`}
            aria-controls={`${base}-${t.id}`}
            aria-selected={tab === t.id}
            tabIndex={tab === t.id ? 0 : -1}
            className={s.tab}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === "avaliacoes" && <span className={s.tabCount}>{product.reviews}</span>}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`${base}-${tab}`} aria-labelledby={`${base}-${tab}-tab`} className={s.panel} key={tab} tabIndex={0}>
        {tab === "descricao" && (
          <div className={s.prose}>
            <p className={s.lead}>{product.description}</p>
            <p>
              {product.kind === "stock"
                ? `Disponível para pronta personalização a partir de ${product.minQty} peças, com grade mista de tamanhos. Personalize com ${product.techniques.join(", ").replace(/, ([^,]*)$/, " ou $1")} e acompanhe tudo pelo site: você envia a logo, recebe o layout e aprova antes da produção.`
                : `Modelo desenvolvido sob medida a partir de ${product.minQty} peças. Um consultor ajuda a definir tecido, cores e acabamentos para que o uniforme represente a sua marca com consistência.`}
            </p>
          </div>
        )}

        {tab === "caracteristicas" && (
          <ul className={s.featureGrid}>
            {product.features.map((f) => (
              <li key={f}><span><Check size={15} strokeWidth={2.5} /></span>{f}</li>
            ))}
            <li><span><Check size={15} strokeWidth={2.5} /></span>Técnicas: {product.techniques.join(", ")}</li>
            <li><span><Check size={15} strokeWidth={2.5} /></span>Tamanhos: {product.sizes.join(", ")}</li>
          </ul>
        )}

        {tab === "tecido" && (
          <div className={s.fabric}>
            <div className={s.fabricCard}>
              <span className={s.fabricIcon}><Shirt size={24} strokeWidth={1.5} /></span>
              <div>
                <small>Composição</small>
                <b>{product.fabric}</b>
                <p>{product.features[0]}</p>
              </div>
            </div>
            <ul className={s.careList}>
              {careFor(product).map(({ icon: I, text }) => (
                <li key={text}><I size={18} strokeWidth={1.75} /> {text}</li>
              ))}
            </ul>
          </div>
        )}

        {tab === "medidas" && (
          <div className={s.measures}>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <caption className="sr-only">Tabela de medidas em centímetros</caption>
                <thead>
                  <tr>
                    <th scope="col">Medida (cm)</th>
                    {product.sizes.map((z) => <th key={z} scope="col">{z}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {cols.map((c, ci) => (
                    <tr key={c}>
                      <th scope="row">{c}</th>
                      {product.sizes.map((z) => <td key={z}>{table[z][ci]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!isPants && (
              <svg viewBox="0 0 120 110" className={s.measureArt} aria-hidden>
                <path d="M42 10 28 16 10 32l10 14 10-7v61h60V39l10 7 10-14-18-16-14-6c-3 7-10 11-18 11s-15-4-18-11Z" />
                <path d="M30 60h60" data-line />
                <path d="M100 16v84" data-line />
                <path d="M92 20 104 36" data-line />
                <text x="60" y="56">A</text>
                <text x="108" y="62">B</text>
                <text x="104" y="24">C</text>
              </svg>
            )}
            <p className={s.note}>Medidas aproximadas da peça plana, com tolerância de ±2 cm. Em caso de dúvida, peça uma peça-piloto ao consultor.</p>
          </div>
        )}

        {tab === "avaliacoes" && (
          <div className={s.reviews}>
            <div className={s.reviewSummary}>
              <strong>{product.rating.toFixed(1)}</strong>
              <div>
                <span className={s.stars} aria-hidden>
                  {Array.from({ length: 5 }, (_, i) => <Star key={i} size={16} fill={i < Math.round(product.rating) ? "currentColor" : "none"} />)}
                </span>
                <small>{product.reviews} avaliações</small>
              </div>
            </div>
            <p className={s.note}>Exemplos ilustrativos de avaliações. Os depoimentos reais dos clientes aparecerão aqui.</p>
            <ul className={s.reviewList}>
              {sampleReviews(product).map((r) => (
                <li key={r.who}>
                  <div className={s.reviewHead}>
                    <span className={s.avatar} aria-hidden>{r.who.charAt(0)}</span>
                    <div>
                      <b>{r.who}</b>
                      <Rating value={r.stars} />
                    </div>
                  </div>
                  <p>{r.text}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
