// Estado de filtros do catálogo: parse/serialização da URL e aplicação sobre o catálogo (funções puras).
import { categories, getCategory, getColor, products, type Product, type SaleKind, type Size, type Technique } from "@/lib/catalog";

export type SortKey = "relevancia" | "menor-preco" | "maior-preco" | "avaliados" | "novidades";
export type PriceRange = "ate-40" | "40-70" | "acima-70";

export type Filters = {
  categoria: string | null;
  tipos: SaleKind[];
  cores: string[];
  tamanhos: Size[];
  preco: PriceRange | null;
  tecnicas: Technique[];
  q: string;
  ordem: SortKey;
};

export const SIZES: Size[] = ["PP", "P", "M", "G", "GG", "XG", "XGG"];
export const TECHNIQUES: Technique[] = ["Bordado", "DTF", "Silk", "Sublimação"];

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: "relevancia", label: "Relevância" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
  { value: "avaliados", label: "Mais avaliados" },
  { value: "novidades", label: "Novidades" },
];

export const priceRanges: { value: PriceRange; label: string; min: number; max: number }[] = [
  { value: "ate-40", label: "Até R$ 40", min: 0, max: 40 },
  { value: "40-70", label: "R$ 40 a R$ 70", min: 40, max: 70 },
  { value: "acima-70", label: "Acima de R$ 70", min: 70, max: Infinity },
];

export const kindLabels: Record<SaleKind, string> = {
  stock: "Pronta para personalizar",
  custom: "Produção sob medida",
};

export const emptyFilters: Filters = {
  categoria: null,
  tipos: [],
  cores: [],
  tamanhos: [],
  preco: null,
  tecnicas: [],
  q: "",
  ordem: "relevancia",
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const list = (v: string | string[] | undefined) =>
  first(v)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export function parseFilters(p: RawParams): Filters {
  const categoria = first(p.categoria);
  const tipos = list(p.tipo).filter((t): t is SaleKind => t === "stock" || t === "custom");
  const ordem = first(p.ordem) as SortKey;
  const preco = first(p.preco) as PriceRange;
  return {
    categoria: getCategory(categoria) ? categoria : null,
    tipos: tipos.length === 2 ? [] : tipos,
    cores: list(p.cor).filter((c) => !!getColor(c)),
    tamanhos: list(p.tamanho).filter((s): s is Size => SIZES.includes(s as Size)),
    preco: priceRanges.some((r) => r.value === preco) ? preco : null,
    tecnicas: list(p.tecnica).filter((t): t is Technique => TECHNIQUES.includes(t as Technique)),
    q: first(p.q).slice(0, 80),
    ordem: sortOptions.some((o) => o.value === ordem) ? ordem : "relevancia",
  };
}

export function serializeFilters(f: Filters): string {
  const qs = new URLSearchParams();
  if (f.categoria) qs.set("categoria", f.categoria);
  if (f.tipos.length === 1) qs.set("tipo", f.tipos[0]);
  if (f.q.trim()) qs.set("q", f.q.trim());
  if (f.cores.length) qs.set("cor", f.cores.join(","));
  if (f.tamanhos.length) qs.set("tamanho", f.tamanhos.join(","));
  if (f.preco) qs.set("preco", f.preco);
  if (f.tecnicas.length) qs.set("tecnica", f.tecnicas.join(","));
  if (f.ordem !== "relevancia") qs.set("ordem", f.ordem);
  const s = qs.toString().replace(/%2C/g, ",");
  return s ? `?${s}` : "";
}

export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function searchScore(p: Product, q: string) {
  const terms = normalize(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return 1;
  const cat = getCategory(p.category)?.name ?? "";
  const name = normalize(p.name);
  const hay = normalize([p.name, p.short, p.fabric, cat, p.techniques.join(" "), p.features.join(" "), p.badge ?? ""].join(" "));
  let score = 0;
  for (const t of terms) {
    if (!hay.includes(t)) return 0;
    score += name.includes(t) ? 3 : 1;
  }
  return score;
}

/** Aplica filtros. `except` ignora uma faceta (útil para contagens por faceta). */
export function applyFilters(f: Filters, except?: keyof Filters): Product[] {
  const range = priceRanges.find((r) => r.value === f.preco);
  const scored = products
    .map((p, index) => ({ p, index, score: except === "q" ? 1 : searchScore(p, f.q) }))
    .filter(({ p, score }) => {
      if (score <= 0) return false;
      if (except !== "categoria" && f.categoria && p.category !== f.categoria) return false;
      if (except !== "tipos" && f.tipos.length && !f.tipos.includes(p.kind)) return false;
      if (except !== "cores" && f.cores.length && !f.cores.some((c) => p.colors.includes(c))) return false;
      if (except !== "tamanhos" && f.tamanhos.length && !f.tamanhos.some((s) => p.sizes.includes(s))) return false;
      if (except !== "tecnicas" && f.tecnicas.length && !f.tecnicas.some((t) => p.techniques.includes(t))) return false;
      if (except !== "preco" && range && (p.kind !== "stock" || p.price < range.min || p.price >= range.max)) return false;
      return true;
    });

  const isNew = (p: Product) => (p.badge === "Novo" ? 1 : 0);
  scored.sort((a, b) => {
    switch (f.ordem) {
      case "menor-preco":
        return priceOf(a.p) - priceOf(b.p);
      case "maior-preco":
        return priceOf(b.p) - priceOf(a.p);
      case "avaliados":
        return b.p.reviews - a.p.reviews || b.p.rating - a.p.rating;
      case "novidades":
        return isNew(b.p) - isNew(a.p) || b.index - a.index;
      default:
        return b.score - a.score || a.index - b.index;
    }
  });
  return scored.map((x) => x.p);
}

// sob medida (sem preço) vai para o fim nas ordenações por preço
const priceOf = (p: Product) => (p.kind === "stock" ? p.price : Number.MAX_SAFE_INTEGER / 2);

export function countActive(f: Filters) {
  return (
    (f.categoria ? 1 : 0) +
    (f.tipos.length ? 1 : 0) +
    f.cores.length +
    f.tamanhos.length +
    (f.preco ? 1 : 0) +
    f.tecnicas.length +
    (f.q.trim() ? 1 : 0)
  );
}

export type ActiveChip = { key: string; label: string; remove: (f: Filters) => Filters };

export function activeChips(f: Filters): ActiveChip[] {
  const chips: ActiveChip[] = [];
  if (f.q.trim()) chips.push({ key: "q", label: `“${f.q.trim()}”`, remove: (x) => ({ ...x, q: "" }) });
  if (f.categoria)
    chips.push({ key: "cat", label: getCategory(f.categoria)?.name ?? f.categoria, remove: (x) => ({ ...x, categoria: null }) });
  for (const t of f.tipos) chips.push({ key: `t-${t}`, label: kindLabels[t], remove: (x) => ({ ...x, tipos: x.tipos.filter((k) => k !== t) }) });
  for (const c of f.cores)
    chips.push({ key: `c-${c}`, label: getColor(c)?.name ?? c, remove: (x) => ({ ...x, cores: x.cores.filter((k) => k !== c) }) });
  for (const s of f.tamanhos)
    chips.push({ key: `s-${s}`, label: `Tam. ${s}`, remove: (x) => ({ ...x, tamanhos: x.tamanhos.filter((k) => k !== s) }) });
  if (f.preco)
    chips.push({ key: "p", label: priceRanges.find((r) => r.value === f.preco)?.label ?? "", remove: (x) => ({ ...x, preco: null }) });
  for (const t of f.tecnicas)
    chips.push({ key: `tec-${t}`, label: t, remove: (x) => ({ ...x, tecnicas: x.tecnicas.filter((k) => k !== t) }) });
  return chips;
}

export const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export { categories };
