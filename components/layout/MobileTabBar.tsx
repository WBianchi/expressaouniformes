"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, ShoppingBag, ClipboardList, Store, type LucideIcon } from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";
import s from "./MobileTabBar.module.css";

type Tab = { id: string; label: string; Icon: LucideIcon; href?: string; drawer?: "cart" | "favorites" };
const tabs: Tab[] = [
  { id: "home", label: "Início", Icon: House, href: "/" },
  { id: "loja", label: "Loja", Icon: Store, href: "/loja" },
  { id: "custom", label: "Orçamento", Icon: ClipboardList, href: "/orcamento" },
  { id: "fav", label: "Favoritos", Icon: Heart, drawer: "favorites" },
  { id: "cart", label: "Carrinho", Icon: ShoppingBag, drawer: "cart" },
];

/** Barra de navegação fixa no rodapé (telas < 900px). */
export function MobileTabBar() {
  const pathname = usePathname();
  const { drawer, openDrawer, ready, favorites, summary } = useStore();

  const activeId =
    drawer === "cart" ? "cart" : drawer === "favorites" ? "fav" :
    pathname === "/" ? "home" :
    pathname.startsWith("/loja") || pathname.startsWith("/produto") ? "loja" :
    pathname.startsWith("/orcamento") ? "custom" :
    pathname.startsWith("/favoritos") ? "fav" :
    pathname.startsWith("/carrinho") || pathname.startsWith("/checkout") ? "cart" : null;
  const idx = tabs.findIndex((t) => t.id === activeId);

  const badge = (t: Tab) => {
    if (!ready) return 0;
    if (t.id === "cart") return summary.items;
    if (t.id === "fav") return favorites.length;
    return 0;
  };

  return (
    <nav className={s.bar} aria-label="Navegação rápida" style={{ "--i": idx } as React.CSSProperties}>
      {idx >= 0 && <span className={s.indicator} aria-hidden />}
      {tabs.map((t) => {
        const active = t.id === activeId;
        const n = badge(t);
        const inner = (
          <>
            <span className={s.icon}>
              <t.Icon size={22} strokeWidth={active ? 2.1 : 1.75} fill={active && t.id === "fav" ? "currentColor" : "none"} />
              {n > 0 && (
                <span key={n} className={s.badge} data-tone={t.id}>
                  {n > 99 ? "99+" : n}
                </span>
              )}
            </span>
            <span className={s.label}>{t.label}</span>
          </>
        );
        return t.href ? (
          <Link key={t.id} href={t.href} className={s.tab} data-active={active || undefined} aria-current={active ? "page" : undefined}>
            {inner}
          </Link>
        ) : (
          <button
            key={t.id}
            type="button"
            className={s.tab}
            data-active={active || undefined}
            aria-label={`${t.label}${n ? `, ${n}` : ""}`}
            onClick={() => openDrawer(t.drawer!)}
          >
            {inner}
          </button>
        );
      })}
    </nav>
  );
}
