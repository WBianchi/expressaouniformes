"use client";
// Logo da empresa compartilhada por todo o site: enviada uma vez, aparece na prévia
// de qualquer peça, no carrinho e no orçamento. Guarda só a miniatura no navegador.
import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { LogoValue } from "./LogoUpload";

const KEY = "eu-logo";
const EVENT = "eu-logo-change";

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
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

function parse(raw: string | null): LogoValue {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return typeof v?.thumb === "string" && v.thumb.startsWith("data:image/") && typeof v.name === "string" ? v : null;
  } catch {
    return null;
  }
}

export function useBrandLogo(): [LogoValue, (v: LogoValue) => void] {
  // a string crua é estável entre leituras; o objeto é derivado dela
  const raw = useSyncExternalStore(subscribe, read, () => null);
  const set = useCallback((v: LogoValue) => {
    try {
      if (v) localStorage.setItem(KEY, JSON.stringify(v));
      else localStorage.removeItem(KEY);
    } catch {
      /* armazenamento cheio ou bloqueado: a logo vale só nesta página */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  const logo = useMemo(() => parse(raw), [raw]);
  return [logo, set];
}
