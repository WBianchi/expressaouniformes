"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Boxes,
  Check,
  ChevronRight,
  Cog,
  Headset,
  LayoutGrid,
  List,
  MessageCircle,
  Package,
  Palette,
  Ruler,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Stamp,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { getCategory, whatsappLink, type Product } from "@/lib/catalog";
import { ProductCard } from "@/components/ui/ProductCard";
import { Drawer } from "@/components/ui/Drawer";
import { CategoryIcon } from "@/components/ui/primitives";
import { useReveal } from "@/components/product/motion";
import { HeroImage } from "./HeroImage";
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
  const stockList = results.filter((p) => p.kind === "stock");
  const customList = results.filter((p) => p.kind === "custom");
  const showStock = !filters.tipos.length || filters.tipos.includes("stock");
  const showCustom = !filters.tipos.length || filters.tipos.includes("custom");
  const active = countActive(filters);
  const chips = activeChips(filters);
  const category = filters.categoria ? getCategory(filters.categoria) : undefined;
  const clearAll = () => setFilters({ ...emptyFilters, ordem: filters.ordem });
  const listKey = `${qs}|${view}`;
  useReveal(rootRef, [listKey]);

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
              {showStock && stockList.length > 0 && (
                <section className={s.stockSection} aria-labelledby="sec-stock">
                  <div className={s.secHead}>
                    <div>
                      <span className={s.stockTag}><Zap size={14} fill="currentColor" /> Pronta para personalizar</span>
                      <h2 id="sec-stock">{category ? category.name : "Modelos"} disponíveis em estoque</h2>
                      <p>Modelos básicos, ideais para personalização com a sua logo.</p>
                    </div>
                    <div className={s.infoCard}>
                      <span className={s.infoIcon}><Boxes size={22} strokeWidth={1.75} /></span>
                      <div>
                        <b>Peças em estoque</b>
                        <p>Escolha a cor, a quantidade e envie sua logo. Produção rápida após a aprovação da arte.</p>
                      </div>
                    </div>
                  </div>
                  <ProductList key={`s-${listKey}`} items={stockList} view={view} />
                  <ul className={s.benefits} data-reveal="">
                    <Benefit icon={<Palette size={20} strokeWidth={1.75} />} title="Diversas cores" text="em estoque" />
                    <Benefit icon={<Ruler size={20} strokeWidth={1.75} />} title="Do P ao XG" text="grade completa" />
                    <Benefit icon={<Stamp size={20} strokeWidth={1.75} />} title="DTF, silk ou bordado" text="personalização" />
                    <Benefit icon={<ShoppingBag size={20} strokeWidth={1.75} />} title="Compra 100% online" text="a partir de 5 peças" />
                    <Benefit icon={<Truck size={20} strokeWidth={1.75} />} title="Produção rápida" text="após aprovação da arte" />
                  </ul>
                </section>
              )}

              {showCustom && customList.length > 0 && (
                <section className={s.customSection} aria-labelledby="sec-custom" data-reveal="">
                  <div className={s.secHead}>
                    <div>
                      <span className={s.customTag}><Sparkles size={14} /> Produção sob medida</span>
                      <h2 id="sec-custom">Modelos personalizados para sua empresa</h2>
                      <p>Desenvolvemos uniformes exclusivos com tecidos, cores e acabamentos de acordo com a necessidade da sua operação.</p>
                    </div>
                    <ul className={s.checkCard}>
                      {["Modelagem personalizada", "Escolha de tecidos e cores", "Gola, punho, friso e botões", "Recortes e detalhes especiais", "Atendimento consultivo"].map((t) => (
                        <li key={t}><Check size={14} strokeWidth={3} /> {t}</li>
                      ))}
                    </ul>
                  </div>
                  <ProductList key={`c-${listKey}`} items={customList} view={view} />
                  <div className={s.customCta} data-reveal="">
                    <Link href="/sob-medida" className="btn btn-primary btn-lg">
                      Desenvolver meu uniforme <ArrowRight size={17} />
                    </Link>
                    <a
                      className={s.consultant}
                      href={whatsappLink("Olá! Quero falar com um consultor para criar um uniforme sob medida.")}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className={s.consultantIcon}><Headset size={20} strokeWidth={1.75} /></span>
                      <span>Falar com um consultor<small>para criar seu modelo pelo WhatsApp</small></span>
                    </a>
                  </div>
                </section>
              )}

              {showCustom && customList.length === 0 && filters.tipos.length !== 1 && stockList.length > 0 && (
                <aside className={s.customHint} data-reveal="">
                  <span className={s.infoIcon}><Cog size={20} strokeWidth={1.75} /></span>
                  <div>
                    <b>Precisa de um modelo exclusivo?</b>
                    <p>Criamos peças sob medida com as cores e os acabamentos da sua marca, a partir de 30 peças.</p>
                  </div>
                  <Link href="/sob-medida" className="btn btn-outline btn-sm">Conhecer <ArrowRight size={15} /></Link>
                </aside>
              )}
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

function Benefit({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li>
      <span className={s.benefitIcon}>{icon}</span>
      <span><b>{title}</b><small>{text}</small></span>
    </li>
  );
}

function CategoryHero({ filters }: { filters: Filters }) {
  const category = filters.categoria ? getCategory(filters.categoria) : undefined;
  const only = filters.tipos.length === 1 ? filters.tipos[0] : null;
  const title = category?.name ?? (only === "custom" ? "Produção sob medida" : only === "stock" ? "Pronta para personalizar" : "Todos os produtos");
  const subtitle =
    category?.description ??
    (only === "custom"
      ? "Modelos exclusivos desenvolvidos com as cores e os acabamentos da sua marca."
      : only === "stock"
        ? "Peças em estoque para personalizar com a sua logo e receber rapidinho."
        : "Uniformes em estoque para personalizar e modelos sob medida para a sua empresa.");
  return (
    <header className={s.hero}>
      <div className={s.heroBg} aria-hidden>
        <HeroImage
          key={category?.slug ?? "all"}
          sources={category ? [category.image, "/images/sections/catalog-hero.webp"] : ["/images/sections/catalog-hero.webp"]}
          className={s.heroImg}
        />
      </div>
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
          {category && <span className={s.heroIcon}><CategoryIcon name={category.icon} size={26} /></span>}
          <h1>{title}</h1>
        </div>
        <p className={s.heroSub}>{subtitle}</p>
        <ul className={s.heroBenefits}>
          <li><ShieldCheck size={22} strokeWidth={1.75} /><span><b>Qualidade profissional</b><small>Produção própria</small></span></li>
          <li><Stamp size={22} strokeWidth={1.75} /><span><b>Personalização</b><small>com a sua logo</small></span></li>
          <li><Package size={22} strokeWidth={1.75} /><span><b>Em estoque</b><small>pronta personalização</small></span></li>
          <li><Truck size={22} strokeWidth={1.75} /><span><b>A partir de 5 peças</b><small>Entregamos em todo o Brasil</small></span></li>
        </ul>
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
