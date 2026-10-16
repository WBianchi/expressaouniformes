"use client";
import { Check, LayoutGrid, Package, Sparkles } from "lucide-react";
import { colors, products, type SaleKind } from "@/lib/catalog";
import { CategoryIcon } from "@/components/ui/primitives";
import { applyFilters, categories, kindLabels, saleMode, priceRanges, SIZES, TECHNIQUES, toggle, type Filters } from "./filters";
import s from "./Catalog.module.css";

const usedColors = colors.filter((c) => products.some((p) => p.colors.includes(c.id)));

export function FilterPanel({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const byCategory = applyFilters(filters, "categoria");
  const byKind = applyFilters(filters, "tipos");
  const countCat = (slug: string | null) => (slug ? byCategory.filter((p) => p.category === slug).length : byCategory.length);
  const countKind = (k: SaleKind) => byKind.filter((p) => saleMode(p) === k).length;

  return (
    <div className={s.filters}>
      <section className={s.fGroup} aria-labelledby="f-cat">
        <h3 id="f-cat" className={s.fTitle}>Categorias</h3>
        <ul className={s.catList}>
          <li>
            <button type="button" className={s.catItem} data-active={!filters.categoria || undefined} aria-pressed={!filters.categoria} onClick={() => set({ categoria: null })}>
              <span className={s.catIcon}><LayoutGrid size={18} strokeWidth={1.75} /></span>
              <span className={s.catName}>Todos os produtos</span>
              <span className={s.catCount}>{countCat(null)}</span>
            </button>
          </li>
          {categories.map((c) => {
            const n = countCat(c.slug);
            const active = filters.categoria === c.slug;
            return (
              <li key={c.slug}>
                <button
                  type="button"
                  className={s.catItem}
                  data-active={active || undefined}
                  data-empty={(!n && !active) || undefined}
                  aria-pressed={active}
                  onClick={() => set({ categoria: active ? null : c.slug })}
                >
                  <span className={s.catIcon}><CategoryIcon name={c.icon} size={18} /></span>
                  <span className={s.catName}>{c.name}</span>
                  <span className={s.catCount}>{n}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={s.fGroup} aria-labelledby="f-kind">
        <h3 id="f-kind" className={s.fTitle}>Tipo de compra</h3>
        {(["stock", "custom"] as SaleKind[]).map((k) => (
          <label key={k} className={s.check} data-kind={k}>
            <input type="checkbox" checked={filters.tipos.includes(k)} onChange={() => set({ tipos: toggle(filters.tipos, k) })} />
            <span className={s.checkBox} aria-hidden><Check size={13} strokeWidth={3} /></span>
            <span className={s.checkLabel}>
              {k === "stock" ? <Package size={15} /> : <Sparkles size={15} />}
              <span>
                {kindLabels[k]}
                <small>{k === "stock" ? "Em estoque, a partir de 5 peças" : "Modelos exclusivos, a partir de 30 peças"}</small>
              </span>
            </span>
            <span className={s.catCount}>{countKind(k)}</span>
          </label>
        ))}
      </section>

      <section className={s.fGroup} aria-labelledby="f-color">
        <h3 id="f-color" className={s.fTitle}>Cores</h3>
        <div className={s.colorGrid} role="group" aria-labelledby="f-color">
          {usedColors.map((c) => {
            const on = filters.cores.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={s.colorBtn}
                style={{ "--sw": c.hex } as React.CSSProperties}
                data-active={on || undefined}
                data-light={["branco", "amarelo", "limao", "celeste"].includes(c.id) || undefined}
                aria-pressed={on}
                aria-label={c.name}
                title={c.name}
                onClick={() => set({ cores: toggle(filters.cores, c.id) })}
              >
                <Check size={14} strokeWidth={3} aria-hidden />
              </button>
            );
          })}
        </div>
      </section>

      <section className={s.fGroup} aria-labelledby="f-size">
        <h3 id="f-size" className={s.fTitle}>Tamanhos</h3>
        <div className={s.pillGrid} role="group" aria-labelledby="f-size">
          {SIZES.map((z) => {
            const on = filters.tamanhos.includes(z);
            return (
              <button key={z} type="button" className={s.pill} data-active={on || undefined} aria-pressed={on} onClick={() => set({ tamanhos: toggle(filters.tamanhos, z) })}>
                {z}
              </button>
            );
          })}
        </div>
      </section>

      <section className={s.fGroup} aria-labelledby="f-price">
        <h3 id="f-price" className={s.fTitle}>Faixa de preço <small>(por peça lisa)</small></h3>
        <div className={s.radioList} role="radiogroup" aria-labelledby="f-price">
          {priceRanges.map((r) => {
            const on = filters.preco === r.value;
            return (
              <button key={r.value} type="button" role="radio" aria-checked={on} className={s.radio} data-active={on || undefined} onClick={() => set({ preco: on ? null : r.value })}>
                <span className={s.radioDot} aria-hidden />
                {r.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className={s.fGroup} aria-labelledby="f-tech">
        <h3 id="f-tech" className={s.fTitle}>Técnica de personalização</h3>
        <div className={s.pillGrid} role="group" aria-labelledby="f-tech">
          {TECHNIQUES.map((t) => {
            const on = filters.tecnicas.includes(t);
            return (
              <button key={t} type="button" className={s.pill} data-wide data-active={on || undefined} aria-pressed={on} onClick={() => set({ tecnicas: toggle(filters.tecnicas, t) })}>
                {t}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
