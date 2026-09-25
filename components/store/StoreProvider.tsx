"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { flushSync } from "react-dom";
import { registerStoreTools } from "@/lib/webmcp";
import { cartItemSchema, localStoreSchema } from "@/lib/design-validation";
import { toast } from "sonner";
import {
  type Product,
  type Design,
  type CartItem,
  quantity,
} from "@/lib/catalog";
const Studio = dynamic(() => import("@/components/studio/StudioModal"), {
  ssr: false,
});
type Context = {
  cart: CartItem[];
  favorites: string[];
  compare: string[];
  openStudio: (p: Product, d?: Design, id?: string) => void;
  removeItem: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleCompare: (id: string) => void;
  ready: boolean;
};
const StoreContext = createContext<Context>(null!);
export function useStore() {
  return useContext(StoreContext);
}
export default function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]),
    [favorites, setFavorites] = useState<string[]>([]),
    [compare, setCompare] = useState<string[]>([]),
    [ready, setReady] = useState(false);
  const [studio, setStudio] = useState<{
    product: Product;
    design?: Design;
    id?: string;
  } | null>(null);
  useEffect(
    () =>
      registerStoreTools((product) => flushSync(() => setStudio({ product }))),
    [],
  );
  useEffect(() => {
    try {
      const s = localStoreSchema.parse(
        JSON.parse(localStorage.getItem("expressao-demo-v1") || "{}"),
      );
      if (Array.isArray(s.cart)) setCart(s.cart);
      if (Array.isArray(s.favorites)) setFavorites(s.favorites);
    } catch {
      toast.error("Não foi possível restaurar os dados locais.");
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(
          "expressao-demo-v1",
          JSON.stringify({ cart, favorites }),
        );
      } catch {
        toast.error(
          "Armazenamento local cheio. Exporte seu projeto para preservá-lo.",
        );
      }
  }, [cart, favorites, ready]);
  function add(design: Design) {
    if (!studio) return;
    const item = {
      id: studio.id || crypto.randomUUID(),
      productId: studio.product.id,
      design: structuredClone(design),
      quantity: quantity(design.sizes),
    };
    const parsed = cartItemSchema.safeParse(item);
    if (!parsed.success) {
      toast.error("Confira a grade e a personalização antes de adicionar.");
      return;
    }
    setCart((v) =>
      studio.id ? v.map((x) => (x.id === studio.id ? item : x)) : [...v, item],
    );
    setStudio(null);
    toast.success("Personalização adicionada ao carrinho local.");
  }
  return (
    <StoreContext.Provider
      value={{
        cart,
        favorites,
        compare,
        ready,
        openStudio: (product, design, id) => setStudio({ product, design, id }),
        removeItem: (id) => setCart((v) => v.filter((x) => x.id !== id)),
        toggleFavorite: (id) =>
          setFavorites((v) =>
            v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
          ),
        toggleCompare: (id) =>
          setCompare((v) =>
            v.includes(id)
              ? v.filter((x) => x !== id)
              : v.length < 3
                ? [...v, id]
                : (toast.info("Compare até 3 produtos."), v),
          ),
      }}
    >
      {children}
      {studio && (
        <Studio
          product={studio.product}
          initial={studio.design}
          onClose={() => setStudio(null)}
          onAdd={add}
        />
      )}
    </StoreContext.Provider>
  );
}
