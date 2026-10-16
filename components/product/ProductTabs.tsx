"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, Droplets, Info, Shirt, ThermometerSun, Wind } from "lucide-react";
import { inStock, type Product, type Size } from "@/lib/catalog";
import s from "./Product.module.css";

type TabId = "descricao" | "caracteristicas" | "tecido" | "medidas";
const tabs: { id: TabId; label: string }[] = [
  { id: "descricao", label: "Descrição" },
  { id: "caracteristicas", label: "Características" },
  { id: "tecido", label: "Tecido e cuidados" },
  { id: "medidas", label: "Tabela de medidas" },
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
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`${base}-${tab}`} aria-labelledby={`${base}-${tab}-tab`} className={s.panel} key={tab} tabIndex={0}>
        {tab === "descricao" && (
          <div className={s.prose}>
            <p className={s.lead}>{product.description}</p>
            <p>
              {inStock(product)
                ? `Disponível para pronta personalização a partir de ${product.minQty} peças, com grade mista de tamanhos. Personalize com ${product.techniques.join(", ").replace(/, ([^,]*)$/, " ou $1")} e acompanhe tudo pelo site: você envia a logo, recebe o layout e aprova antes da produção.`
                : `Disponível por orçamento para empresas, a partir de 30 peças no pedido. Um consultor confirma cores, personalização e prazo antes da produção.`}
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

      </div>
    </section>
  );
}
