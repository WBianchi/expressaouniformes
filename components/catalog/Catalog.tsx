"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  LayoutGrid,
  List,
  MessageCircle,
  Search,
  SlidersHorizontal,
  X,
  } from "lucide-react";
import { getCategory, inStock, whatsappLink, type Product } from "@/lib/catalog";
import { ProductCard } from "@/components/ui/ProductCard";
import { Drawer } from "@/components/ui/Drawer";
import { CategoryIcon } from "@/components/ui/primitives";
import { FilterPanel } from "./FilterPanel";
import { ProductRow } from "./ProductRow";
import {
  activeChips,
  applyFilters,
  categories,
  countActive,
  emptyFilters,
  serializeFilters,
  sortOptions,
  type Filters,
  type SortKey,
} from "./filters";
import s from "./Catalog.module.css";

type View = "grid" | "list";
const VIEW_KEY = "eu-catalog-view";

export default function Catalog({ initial }: { initial: Filters }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(initial);
  const [view, setView] = useState<View>("grid");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // sincronização com a URL (sem rolar a página)
  const initialKey = serializeFilters(initial);
  const written = useRef<Set<string>>(new Set([initialKey]));
  useEffect(() => {
    // navegação externa (ex.: busca do header, voltar/avançar) — adota o estado da URL
    if (!written.current.has(initialKey)) {
      written.current = new Set([initialKey]);
      setFilters(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  const qs = serializeFilters(filters);
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (qs === window.location.search || (qs === "" && window.location.search === "")) return;
      written.current.add(qs);
      router.replace(`/loja${qs}`, { scroll: false });
    }, 280);
    return () => window.clearTimeout(t);
  }, [qs, router]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "list" || v === "grid") setView(v);
    } catch {
      /* sem armazenamento */
    }
  }, []);
  const changeView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* sem armazenamento */
    }
  };

  const results = useMemo(() => applyFilters(filters), [filters]);
  // em estoque primeiro; a ordenação escolhida vale dentro de cada grupo
  const sorted = [...results.filter(inStock), ...results.filter((p) => !inStock(p))];
  const active = countActive(filters);
  const chips = activeChips(filters);
  const clearAll = () => setFilters({ ...emptyFilters, ordem: filters.ordem });
  const listKey = `${qs}|${view}`;

  return (
    <div className={s.page} ref={rootRef}>
      <CategoryHero filters={filters} />

      <div className={`container ${s.layout}`}>
        <aside className={s.sidebar} aria-label="Filtros">
          <div className={s.sidebarInner}>
            <div className={s.sidebarHead}>
              <span><SlidersHorizontal size={16} /> Filtros</span>
              {active > 0 && (
                <button type="button" className={s.linkBtn} onClick={clearAll}>Limpar ({active})</button>
              )}
            </div>
            <FilterPanel filters={filters} onChange={setFilters} />
          </div>
        </aside>

        <div className={s.main}>
          <div className={s.toolbar} role="search">
            <label className={s.searchBox}>
              <Search size={17} aria-hidden />
              <span className="sr-only">Buscar nos resultados</span>
              <input
                type="search"
                placeholder="Buscar nos resultados…"
                value={filters.q}
                maxLength={80}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              />
              {filters.q && (
                <button type="button" aria-label="Limpar busca" onClick={() => setFilters({ ...filters, q: "" })}>
                  <X size={15} />
                </button>
              )}
            </label>
            <div className={s.toolRow}>
              <button type="button" className={s.filterBtn} onClick={() => setDrawerOpen(true)} aria-label={`Abrir filtros${active ? `, ${active} ativos` : ""}`}>
                <SlidersHorizontal size={16} /> Filtros
                {active > 0 && <span className={s.badgeCount}>{active}</span>}
              </button>
              <p className={s.count} aria-live="polite">
                <b>{results.length}</b> {results.length === 1 ? "produto" : "produtos"}
              </p>
              <label className={s.sortBox}>
                <span className="sr-only">Ordenar por</span>
                <select value={filters.ordem} onChange={(e) => setFilters({ ...filters, ordem: e.target.value as SortKey })}>
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
              <div className={s.viewToggle} role="group" aria-label="Modo de exibição">
                <button type="button" aria-pressed={view === "grid"} aria-label="Grade" onClick={() => changeView("grid")}><LayoutGrid size={17} /></button>
                <button type="button" aria-pressed={view === "list"} aria-label="Lista" onClick={() => changeView("list")}><List size={17} /></button>
              </div>
            </div>
          </div>

          {chips.length > 0 && (
            <div className={s.chips} aria-label="Filtros ativos">
              {chips.map((c) => (
                <button key={c.key} type="button" className={s.activeChip} onClick={() => setFilters(c.remove(filters))} aria-label={`Remover filtro ${c.label}`}>
                  {c.label} <X size={13} />
                </button>
              ))}
              <button type="button" className={s.linkBtn} onClick={clearAll}>Limpar tudo</button>
            </div>
          )}

          {results.length === 0 ? (
            <EmptyState onClear={clearAll} q={filters.q} onCategory={(slug) => setFilters({ ...emptyFilters, categoria: slug })} />
          ) : (
            <>
              <ProductList key={listKey} items={sorted} view={view} />
              <aside className={s.customHint}>
                <div>
                  <b>Pedido para empresa, com 30 peças ou mais?</b>
                  <p>Junte vários modelos, cores e quantidades em um só orçamento, inclusive itens sob cotação.</p>
                </div>
                <Link href="/orcamento" className="btn btn-outline btn-sm">
                  Monte seu pedido <ArrowRight size={15} />
                </Link>
              </aside>
            </>
          )}
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Filtros"
        description={active ? `${active} ${active === 1 ? "filtro ativo" : "filtros ativos"}` : "Refine os produtos"}
        side="bottom"
        footer={
          <div className={s.drawerFoot}>
            <button type="button" className="btn btn-outline" onClick={clearAll} disabled={!active}>Limpar</button>
            <button type="button" className="btn btn-primary" onClick={() => setDrawerOpen(false)}>
              Ver {results.length} {results.length === 1 ? "resultado" : "resultados"}
            </button>
          </div>
        }
      >
        <FilterPanel filters={filters} onChange={setFilters} />
      </Drawer>
    </div>
  );
}

function ProductList({ items, view }: { items: Product[]; view: View }) {
  if (view === "list")
    return (
      <div className={s.list}>
        {items.map((p, i) => (
          <div key={p.slug} className={s.rowItem} style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}>
            <ProductRow product={p} />
          </div>
        ))}
      </div>
    );
  return (
    <div className={s.grid}>
      {items.map((p, i) => (
        <div key={p.slug} className={s.gridItem} style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}>
          <ProductCard product={p} priority={i < 2} />
        </div>
      ))}
    </div>
  );
}


function CategoryHero({ filters }: { filters: Filters }) {
  const category = filters.categoria ? getCategory(filters.categoria) : undefined;
  const only = filters.tipos.length === 1 ? filters.tipos[0] : null;
  const title = category?.name ?? (only === "custom" ? "Por orçamento" : only === "stock" ? "Pronta-entrega" : "Todos os produtos");
  const subtitle =
    category?.description ??
    (only === "custom"
      ? "Modelos sob cotação ou sob encomenda, para pedidos de empresas a partir de 30 peças."
      : only === "stock"
        ? "Em estoque para comprar online, a partir de 5 peças com a sua logo."
        : "Compre online os itens em estoque ou inclua qualquer modelo no orçamento da sua empresa.");
  return (
    <header className={s.hero}>
      <div className={`container ${s.heroInner}`}>
        <nav aria-label="Trilha de navegação" className={s.crumbs}>
          <Link href="/">Início</Link>
          <ChevronRight size={13} aria-hidden />
          <Link href="/loja">Produtos</Link>
          {category && (
            <>
              <ChevronRight size={13} aria-hidden />
              <span aria-current="page">{category.name}</span>
            </>
          )}
        </nav>
        <div className={s.heroTitle}>
                    <h1>{title}</h1>
        </div>
        <p className={s.heroSub}>{subtitle}</p>
      </div>
    </header>
  );
}

function EmptyState({ onClear, onCategory, q }: { onClear: () => void; onCategory: (slug: string) => void; q: string }) {
  return (
    <div className={s.empty}>
      <span className={s.emptyIcon}><Search size={28} strokeWidth={1.5} /></span>
      <h2>Nenhum produto encontrado</h2>
      <p>
        {q.trim() ? <>Não encontramos resultados para <b>“{q.trim()}”</b> com os filtros atuais.</> : "Nenhum produto combina com todos os filtros selecionados."}{" "}
        Tente remover alguns filtros ou explore as categorias abaixo.
      </p>
      <div className={s.emptyActions}>
        <button type="button" className="btn btn-primary" onClick={onClear}>Limpar filtros</button>
        <a className="btn btn-outline" href={whatsappLink("Olá! Não encontrei o uniforme que procuro no site. Podem me ajudar?")} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={16} /> Pedir ajuda
        </a>
      </div>
      <div className={s.emptyCats}>
        {categories.map((c) => (
          <button key={c.slug} type="button" className={s.emptyCat} onClick={() => onCategory(c.slug)}>
            <CategoryIcon name={c.icon} size={18} /> {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
