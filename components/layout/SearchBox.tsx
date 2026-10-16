"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CornerDownLeft, Search, Sparkles, TrendingUp, X } from "lucide-react";
import { categories, getCategory, money, products } from "@/lib/catalog";
import { CategoryIcon, SafeImage } from "@/components/ui/primitives";
import { normalize, useDismiss } from "./hooks";
import s from "./SearchBox.module.css";

type Item =
  | { type: "product"; key: string; href: string; label: string; meta: string; image: string; custom: boolean }
  | { type: "category"; key: string; href: string; label: string; icon: string }
  | { type: "query"; key: string; href: string; label: string };

const popular = ["polo", "camiseta", "jaleco", "moletom", "calça brim"];

/**
 * Busca com sugestões ao vivo (produtos + categorias), navegação ↑ ↓ Enter, Esc fecha.
 * `shortcut` registra o atalho "/" para focar. `inline` mostra as sugestões no fluxo (menu mobile).
 */
export function SearchBox({
  shortcut = false,
  inline = false,
  autoFocus = false,
  size = "lg",
  onNavigate,
  className,
}: {
  shortcut?: boolean;
  inline?: boolean;
  autoFocus?: boolean;
  size?: "md" | "lg";
  onNavigate?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useDismiss([wrap], open && !inline, () => setOpen(false));

  // atalho "/" para focar a busca
  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (!input.current || input.current.offsetParent === null) return;
      e.preventDefault();
      input.current.focus();
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut]);

  const items = useMemo<Item[]>(() => {
    const term = normalize(q);
    if (!term) {
      const top: Item[] = [...products]
        .sort((a, b) => b.reviews - a.reviews)
        .slice(0, 4)
        .map((p) => ({ type: "product", key: `p-${p.slug}`, href: `/produto/${p.slug}`, label: p.name, meta: p.kind === "stock" ? `a partir de ${money(p.price)}` : "Por orçamento · mín. 30 peças", image: p.image, custom: p.kind === "custom" }));
      const cats: Item[] = categories.slice(0, 4).map((c) => ({ type: "category", key: `c-${c.slug}`, href: `/loja?categoria=${c.slug}`, label: c.name, icon: c.icon }));
      return [...top, ...cats];
    }
    const words = term.split(/\s+/);
    const match = (text: string) => {
      const t = normalize(text);
      return words.every((w) => t.includes(w));
    };
    const cats: Item[] = categories
      .filter((c) => match(`${c.name} ${c.description}`))
      .slice(0, 3)
      .map((c) => ({ type: "category", key: `c-${c.slug}`, href: `/loja?categoria=${c.slug}`, label: c.name, icon: c.icon }));
    const prods: Item[] = products
      .filter((p) => match(`${p.name} ${getCategory(p.category)?.name ?? ""} ${p.fabric} ${p.short}`))
      .sort((a, b) => Number(normalize(b.name).startsWith(words[0])) - Number(normalize(a.name).startsWith(words[0])))
      .slice(0, 6)
      .map((p) => ({
        type: "product",
        key: `p-${p.slug}`,
        href: `/produto/${p.slug}`,
        label: p.name,
        meta: p.kind === "stock" ? `a partir de ${money(p.price)}` : "Por orçamento · mín. 30 peças",
        image: p.image,
        custom: p.kind === "custom",
      }));
    return [...prods, ...cats, { type: "query", key: "q", href: `/loja?q=${encodeURIComponent(q.trim())}`, label: q.trim() }];
  }, [q]);

  const go = (href: string) => {
    setOpen(false);
    input.current?.blur();
    onNavigate?.();
    router.push(href);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && items[active]) return go(items[active].href);
    const term = q.trim();
    go(term ? `/loja?q=${encodeURIComponent(term)}` : "/loja");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      if (q && !open) setQ("");
      setOpen(false);
    }
  };

  const showList = inline ? q.trim().length > 0 : open;
  const prods = items.filter((i) => i.type === "product");
  const cats = items.filter((i) => i.type === "category");
  const query = items.find((i) => i.type === "query");
  const idx = (it: Item) => items.indexOf(it);

  const option = (it: Item, children: React.ReactNode) => (
    <li
      key={it.key}
      id={`${id}-${idx(it)}`}
      role="option"
      aria-selected={active === idx(it)}
      data-active={active === idx(it) || undefined}
      className={s.option}
      onPointerDown={(e) => e.preventDefault()}
      onClick={() => go(it.href)}
      onPointerEnter={() => setActive(idx(it))}
    >
      {children}
    </li>
  );

  return (
    <div ref={wrap} className={`${s.wrap} ${className ?? ""}`} data-size={size} data-open={(showList && !inline) || undefined} data-inline={inline || undefined}>
      <form role="search" onSubmit={submit} className={s.form}>
        <Search className={s.icon} size={19} strokeWidth={1.9} aria-hidden />
        <input
          ref={input}
          type="search"
          className={s.input}
          placeholder="Buscar polo, camiseta, jaleco…"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-label="Buscar produtos"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
          enterKeyHint="search"
          autoComplete="off"
        />
        {q ? (
          <button type="button" className={s.clear} aria-label="Limpar busca" onClick={() => { setQ(""); input.current?.focus(); }}>
            <X size={16} />
          </button>
        ) : (
          shortcut && <kbd className={s.kbd} aria-hidden>/</kbd>
        )}
        <button type="submit" className={s.submit} aria-label="Buscar">
          <Search size={17} strokeWidth={2.2} />
          <span>Buscar</span>
        </button>
      </form>

      {showList && (
        <div className={s.panel} data-inline={inline || undefined}>
          {!q.trim() && (
            <div className={s.popular}>
              <span className={s.groupLabel}><TrendingUp size={14} /> Buscas populares</span>
              <div className={s.chips}>
                {popular.map((p) => (
                  <button key={p} type="button" className={s.chipBtn} onPointerDown={(e) => e.preventDefault()} onClick={() => { setQ(p); setActive(-1); input.current?.focus(); }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          <ul id={listId} role="listbox" aria-label="Sugestões" className={s.list}>
            {prods.length > 0 && <li role="presentation" className={s.groupLabel}>{q.trim() ? "Produtos" : "Mais procurados"}</li>}
            {prods.map((it) =>
              it.type === "product"
                ? option(
                    it,
                    <>
                      <span className={s.thumb}><SafeImage src={it.image} alt="" /></span>
                      <span className={s.optText}>
                        <b>{it.label}</b>
                        <small>{it.custom && <Sparkles size={11} />} {it.meta}</small>
                      </span>
                      <ArrowUpRight className={s.optArrow} size={16} />
                    </>,
                  )
                : null,
            )}
            {cats.length > 0 && <li role="presentation" className={s.groupLabel}>Categorias</li>}
            {cats.map((it) =>
              it.type === "category"
                ? option(
                    it,
                    <>
                      <span className={s.catIcon}><CategoryIcon name={it.icon} size={18} /></span>
                      <span className={s.optText}><b>{it.label}</b></span>
                      <ArrowUpRight className={s.optArrow} size={16} />
                    </>,
                  )
                : null,
            )}
            {query &&
              option(
                query,
                <>
                  <span className={s.catIcon}><Search size={17} /></span>
                  <span className={s.optText}>
                    <b>Ver todos os resultados para “{query.label}”</b>
                  </span>
                  <CornerDownLeft className={s.optArrow} size={15} />
                </>,
              )}
            {q.trim() && prods.length === 0 && cats.length === 0 && (
              <li role="presentation" className={s.empty}>Nenhuma sugestão. Tente “polo”, “camiseta” ou “jaleco”.</li>
            )}
          </ul>
          {!inline && (
            <div className={s.hint} aria-hidden>
              <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
              <span><kbd>Enter</kbd> abrir</span>
              <span><kbd>Esc</kbd> fechar</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
