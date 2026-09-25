"use client";
import { useState } from "react";
import { Search, SlidersHorizontal, X, ArrowLeftRight } from "lucide-react";
import { products, categories, money } from "@/lib/catalog";
import ProductCard from "./ProductCard";
import { StoreShell } from "./Chrome";
import { useStore } from "./StoreProvider";
export default function Catalog({
  initialCategory = "Todos",
  initialQuery = "",
  onlyFavorites = false,
}: {
  initialCategory?: string;
  initialQuery?: string;
  onlyFavorites?: boolean;
}) {
  const [category, setCategory] = useState(initialCategory),
    [query, setQuery] = useState(initialQuery),
    [sort, setSort] = useState("popular");
  const { favorites, compare, toggleCompare, openStudio } = useStore();
  const filtered = products
    .filter(
      (p) =>
        (category === "Todos" || p.category === category) &&
        p.name
          .toLocaleLowerCase("pt-BR")
          .includes(query.toLocaleLowerCase("pt-BR")) &&
        (!onlyFavorites || favorites.includes(p.id)),
    )
    .sort((a, b) =>
      sort === "price-up"
        ? a.price - b.price
        : sort === "price-down"
          ? b.price - a.price
          : 0,
    );
  return (
    <StoreShell>
      <div className="page-heading">
        <span className="eyebrow">ENCONTRE A SUA PRÓXIMA EXPRESSÃO</span>
        <h1>
          {onlyFavorites ? "Seus favoritos." : "Feitos para a sua equipe."}
        </h1>
        <p>Escolha uma base. O toque final é seu.</p>
      </div>
      <section className="catalog-layout">
        <aside className="catalog-filters">
          <h3>
            <SlidersHorizontal size={17} /> Categorias
          </h3>
          {categories.map((c) => (
            <button
              className={category === c ? "active" : ""}
              key={c}
              onClick={() => setCategory(c)}
            >
              {c}
              <span>
                {c === "Todos"
                  ? products.length
                  : products.filter((p) => p.category === c).length}
              </span>
            </button>
          ))}
          <div className="filter-note">
            <strong>Seu uniforme, sua marca.</strong>
            <p>
              Todos os modelos desta coleção podem ser personalizados no
              estúdio.
            </p>
          </div>
        </aside>
        <div>
          <div className="catalog-toolbar">
            <div className="search">
              <Search size={17} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar nesta coleção"
                aria-label="Buscar nesta coleção"
              />
            </div>
            <span>{filtered.length} produtos</span>
            <select
              aria-label="Ordenar produtos"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="popular">Destaques</option>
              <option value="price-up">Menor preço</option>
              <option value="price-down">Maior preço</option>
            </select>
          </div>
          {filtered.length ? (
            <div className="product-grid catalog-grid">
              {filtered.map((p) => (
                <ProductCard product={p} key={p.id} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={32} />
              <h2>Nenhuma peça por aqui.</h2>
              <p>Experimente outra busca ou categoria.</p>
              <button
                className="button secondary"
                onClick={() => {
                  setCategory("Todos");
                  setQuery("");
                }}
              >
                Limpar filtros
              </button>
            </div>
          )}
          <p className="demo-caption">
            Coleção e preços demonstrativos. Materiais e valores finais serão
            cadastrados pela fábrica.
          </p>
        </div>
      </section>
      {compare.length > 0 && (
        <section className="compare-panel">
          <h3>
            <ArrowLeftRight size={18} /> Comparar peças
          </h3>
          <div className="compare-grid">
            {compare.map((id) => {
              const p = products.find((x) => x.id === id)!;
              return (
                <div key={id}>
                  <button
                    className="icon-button"
                    aria-label={"Remover " + p.name + " da comparação"}
                    onClick={() => toggleCompare(id)}
                  >
                    <X size={15} />
                  </button>
                  <strong>{p.name}</strong>
                  <span>{p.category}</span>
                  <b>{money(p.price)} / un.</b>
                  <span>30 unidades mínimas</span>
                  <button className="text-button" onClick={() => openStudio(p)}>
                    Personalizar
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </StoreShell>
  );
}
