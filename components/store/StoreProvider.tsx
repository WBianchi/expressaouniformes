"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { getProduct } from "@/lib/catalog";
import { cartLineSchema, localStoreSchema } from "@/lib/validation";
import {
  type CartLine,
  type Coupon,
  type ShippingOption,
  totals,
  validateCoupon,
} from "@/lib/pricing";
import { fetchShippingQuote, shippingSignature } from "@/lib/shipping-client";

export type Drawer = "cart" | "favorites" | "menu" | "search" | null;
export type Theme = "light" | "dark" | "system";

type StoreContext = {
  ready: boolean;
  // carrinho
  cart: CartLine[];
  addToCart: (line: Omit<CartLine, "id">) => boolean;
  updateLine: (id: string, patch: Partial<Omit<CartLine, "id" | "slug">>) => void;
  removeLine: (id: string) => void;
  /** desfaz a última remoção, devolvendo a linha à posição original */
  restoreLine: (id: string) => void;
  clearCart: () => void;
  // cupom e frete
  coupon: Coupon | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  cep: string;
  setCep: (cep: string) => void;
  shippingOptions: ShippingOption[] | null;
  /** consulta à Frenet em andamento */
  shippingLoading: boolean;
  /** mensagem quando a cotação falha ou nenhuma transportadora atende o CEP */
  shippingError: string | null;
  shipping: ShippingOption | null;
  selectShipping: (id: string) => void;
  summary: ReturnType<typeof totals>;
  // favoritos
  favorites: string[];
  isFavorite: (slug: string) => boolean;
  toggleFavorite: (slug: string) => void;
  // UI
  drawer: Drawer;
  openDrawer: (d: Drawer) => void;
  closeDrawer: () => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
};

const Ctx = createContext<StoreContext | null>(null);
export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore fora do StoreProvider");
  return c;
}

const KEY = "eu-store-v2";
export const THEME_KEY = "eu-theme";

export default function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [cep, setCep] = useState("");
  const [shippingId, setShippingId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [theme, setThemeState] = useState<Theme>("system");
  const removed = useRef(new Map<string, { line: CartLine; index: number }>());

  // hidratação do armazenamento local
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
      const s = localStoreSchema.parse(raw);
      setCart(s.cart.flatMap((l) => {
        const r = cartLineSchema.safeParse(l);
        return r.success ? [r.data as CartLine] : [];
      }));
      setFavorites(s.favorites);
      setCouponCode(s.coupon);
      setCep(s.cep);
      const t = localStorage.getItem(THEME_KEY);
      if (t === "light" || t === "dark") setThemeState(t);
    } catch {
      /* armazenamento indisponível ou corrompido: começa vazio */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ cart, favorites, coupon: couponCode, cep }));
    } catch {
      toast.error("Armazenamento do navegador cheio. Remova logos grandes do carrinho.");
    }
  }, [cart, favorites, couponCode, cep, ready]);

  // trava rolagem com drawer aberto e fecha com Esc
  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawer]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    const root = document.documentElement;
    try {
      if (t === "system") {
        localStorage.removeItem(THEME_KEY);
        root.removeAttribute("data-theme");
      } else {
        localStorage.setItem(THEME_KEY, t);
        root.setAttribute("data-theme", t);
      }
    } catch {
      if (t !== "system") root.setAttribute("data-theme", t);
    }
  }, []);

  const subtotalForCoupon = useMemo(() => totals(cart).subtotal, [cart]);
  const coupon = useMemo(() => {
    if (!couponCode) return null;
    const r = validateCoupon(couponCode, subtotalForCoupon);
    return r.ok ? r.coupon : null;
  }, [couponCode, subtotalForCoupon]);

  // cotação real (Frenet) sempre que o CEP ou os itens mudam
  const [quote, setQuote] = useState<{ key: string; options: ShippingOption[] | null; error: string | null } | null>(null);
  const cepDigits = cep.replace(/\D/g, "");
  const sig = shippingSignature(cart);
  const quoteKey = cart.length && cepDigits.length === 8 ? `${cepDigits}|${sig}` : "";
  const cartRef = useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);
  useEffect(() => {
    if (!quoteKey) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetchShippingQuote(cepDigits, cartRef.current, ctrl.signal)
        .then((r) => setQuote({ key: quoteKey, options: r.options.length ? r.options : null, error: r.error ?? null }))
        .catch(() => {
          if (!ctrl.signal.aborted) setQuote({ key: quoteKey, options: null, error: "Não foi possível calcular o frete. Verifique sua conexão." });
        });
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [quoteKey, cepDigits]);
  const current = quote && quote.key === quoteKey ? quote : null;
  const shippingOptions = quoteKey ? (current?.options ?? null) : null;
  const shippingLoading = !!quoteKey && !current;
  const shippingError = quoteKey ? (current?.error ?? null) : null;
  const shipping = shippingOptions?.find((o) => o.id === shippingId) ?? shippingOptions?.[0] ?? null;
  const summary = useMemo(() => totals(cart, coupon, shipping), [cart, coupon, shipping]);

  const value: StoreContext = {
    ready,
    cart,
    addToCart(line) {
      const full = { ...line, id: crypto.randomUUID() };
      const r = cartLineSchema.safeParse(full);
      if (!r.success) {
        toast.error(r.error.issues[0]?.message || "Confira as opções do produto.");
        return false;
      }
      setCart((c) => [...c, full]);
      const p = getProduct(line.slug);
      toast.success(`${p?.name} adicionado ao carrinho`, {
        action: { label: "Ver carrinho", onClick: () => setDrawer("cart") },
      });
      return true;
    },
    updateLine(id, patch) {
      setCart((c) =>
        c.map((l) => {
          if (l.id !== id) return l;
          const next = { ...l, ...patch };
          const r = cartLineSchema.safeParse(next);
          if (!r.success) {
            toast.error(r.error.issues[0]?.message || "Alteração inválida.");
            return l;
          }
          return next;
        }),
      );
    },
    removeLine(id) {
      const index = cart.findIndex((l) => l.id === id);
      if (index >= 0) removed.current.set(id, { line: cart[index], index });
      setCart((c) => c.filter((l) => l.id !== id));
    },
    restoreLine(id) {
      const r = removed.current.get(id);
      if (!r) return;
      removed.current.delete(id);
      setCart((c) => (c.some((l) => l.id === id) ? c : [...c.slice(0, r.index), r.line, ...c.slice(r.index)]));
    },
    clearCart: () => setCart([]),
    coupon,
    applyCoupon(code) {
      const r = validateCoupon(code, subtotalForCoupon);
      if (!r.ok) {
        toast.error(r.error);
        return false;
      }
      setCouponCode(r.coupon.code);
      toast.success(`Cupom ${r.coupon.code} aplicado: ${r.coupon.label}`);
      return true;
    },
    removeCoupon: () => setCouponCode(null),
    cep,
    setCep,
    shippingOptions,
    shippingLoading,
    shippingError,
    shipping,
    selectShipping: setShippingId,
    summary,
    favorites,
    isFavorite: (slug) => favorites.includes(slug),
    toggleFavorite(slug) {
      const has = favorites.includes(slug);
      setFavorites((f) => (has ? f.filter((s) => s !== slug) : [...f, slug]));
      toast(has ? "Removido dos favoritos" : "Salvo nos favoritos", {
        action: has ? undefined : { label: "Ver", onClick: () => setDrawer("favorites") },
      });
    },
    drawer,
    openDrawer: setDrawer,
    closeDrawer: () => setDrawer(null),
    theme,
    setTheme,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
