"use client";
// Lista do orçamento para empresas ("Monte seu pedido"): itens escolhidos nas páginas
// de produto ou na própria página do orçamento. Fica no navegador até ser enviada.
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getProduct, type Position } from "@/lib/catalog";
import { isPlacement, type Placements } from "@/lib/mockup";

export type QuoteItem = {
  id: string;
  slug: string;
  color: string;
  qty: number;
  positions: Position[];
  /** posição/tamanho da logo ajustados pelo cliente na prévia */
  placements?: Placements;
};

const KEY = "eu-quote";
const EVENT = "eu-quote-change";
const POSITIONS: Position[] = ["frente", "costas", "manga"];

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

const valid = (i: unknown): i is QuoteItem => {
  const v = i as QuoteItem;
  const p = v && typeof v.slug === "string" ? getProduct(v.slug) : undefined;
  return (
    !!p &&
    typeof v.id === "string" &&
    p.colors.includes(v.color) &&
    Number.isInteger(v.qty) &&
    v.qty >= 1 &&
    v.qty <= 100_000 &&
    Array.isArray(v.positions) &&
    v.positions.every((x) => POSITIONS.includes(x)) &&
    (v.placements === undefined || (typeof v.placements === "object" && Object.values(v.placements).every(isPlacement)))
  );
};

function parse(raw: string): QuoteItem[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter(valid).slice(0, 60) : [];
  } catch {
    return [];
  }
}

function write(items: QuoteItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* armazenamento indisponível */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useQuote() {
  const router = useRouter();
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const items = useMemo(() => parse(raw), [raw]);
  const total = items.reduce((t, i) => t + i.qty, 0);

  const add = useCallback((item: Omit<QuoteItem, "id">, opts: { silent?: boolean; ifAbsent?: boolean } = {}) => {
    const cur = parse(read());
    if (opts.ifAbsent && cur.some((i) => i.slug === item.slug)) return;
    // mesmo modelo e cor: soma a quantidade em vez de duplicar a linha
    const same = cur.find((i) => i.slug === item.slug && i.color === item.color);
    const next = same
      ? cur.map((i) => (i === same ? { ...i, qty: Math.min(100_000, i.qty + item.qty), positions: item.positions, placements: item.placements } : i))
      : [...cur, { ...item, id: crypto.randomUUID() }];
    write(next);
    if (!opts.silent) toast.success(`${getProduct(item.slug)?.name} no seu orçamento`, { action: { label: "Ver orçamento", onClick: () => router.push("/orcamento") } });
  }, [router]);

  const update = useCallback((id: string, patch: Partial<Omit<QuoteItem, "id" | "slug">>) => {
    write(parse(read()).map((i) => (i.id === id ? { ...i, ...patch } : i)).filter(valid));
  }, []);

  const remove = useCallback((id: string) => write(parse(read()).filter((i) => i.id !== id)), []);
  const clear = useCallback(() => write([]), []);

  return { items, total, add, update, remove, clear };
}
