"use client";
// Logos da empresa compartilhadas pelo site, uma por posição (frente, costas, manga):
// enviadas uma vez, aparecem na prévia de qualquer peça, no carrinho e no orçamento.
// Guarda só as miniaturas no navegador.
import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Position } from "@/lib/catalog";
import type { LogoValue } from "./LogoUpload";

export type LogoSet = Partial<Record<Position, NonNullable<LogoValue>>>;

const KEY = "eu-logos";
/** versão antiga: uma logo só, passa a valer para a frente */
const LEGACY = "eu-logo";
const EVENT = "eu-logo-change";
const POSITIONS: Position[] = ["frente", "costas", "manga"];

function read(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return raw;
    const old = localStorage.getItem(LEGACY);
    return old ? JSON.stringify({ frente: JSON.parse(old) }) : null;
  } catch {
    return null;
  }
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => (e.key === KEY || e.key === LEGACY) && cb();
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

const isLogo = (v: unknown): v is NonNullable<LogoValue> =>
  !!v && typeof (v as { thumb?: unknown }).thumb === "string" && (v as { thumb: string }).thumb.startsWith("data:image/") && typeof (v as { name?: unknown }).name === "string";

function parse(raw: string | null): LogoSet {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    const out: LogoSet = {};
    for (const p of POSITIONS) if (isLogo(v?.[p])) out[p] = v[p];
    return out;
  } catch {
    return {};
  }
}

/** Miniaturas por posição, no formato que a prévia (LogoMockup) usa. */
export const logoThumbs = (logos: LogoSet): Partial<Record<Position, string>> =>
  Object.fromEntries(Object.entries(logos).map(([p, l]) => [p, l.thumb]));

export function useBrandLogos(): [LogoSet, (position: Position, v: LogoValue) => void] {
  // a string crua é estável entre leituras; o objeto é derivado dela
  const raw = useSyncExternalStore(subscribe, read, () => null);
  const logos = useMemo(() => parse(raw), [raw]);
  const set = useCallback((position: Position, v: LogoValue) => {
    const next = { ...parse(read()) };
    if (v) next[position] = v;
    else delete next[position];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      localStorage.removeItem(LEGACY);
    } catch {
      /* armazenamento cheio ou bloqueado: as logos valem só nesta página */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [logos, set];
}
