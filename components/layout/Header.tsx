"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  ChevronDown,
  CreditCard,
  Factory,
  Headset,
  Heart,
  Menu,
  PackageSearch,
  Search,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { company, money, whatsappLink } from "@/lib/catalog";
import { FREE_SHIPPING_FROM } from "@/lib/pricing";
import { useStore } from "@/components/store/StoreProvider";
import { Logo } from "./Logo";
import { SearchBox } from "./SearchBox";
import { ProfileMenu } from "./ProfileMenu";
import { ThemeToggle } from "./ThemeToggle";
import { MegaMenu } from "./MegaMenu";
import { PixIcon } from "./icons";
import { useDismiss } from "./hooks";
import s from "./Header.module.css";

const announcements = [
  { Icon: Truck, text: `Frete grátis acima de ${money(FREE_SHIPPING_FROM).replace(",00", "")}` },
  { Icon: PixIcon, text: "Pagamento no Pix com 5% de desconto" },
  { Icon: Factory, text: "Produção própria — da costura à personalização" },
  { Icon: CreditCard, text: "Parcele em até 6x sem juros no cartão" },
];

export const navLinks = [
  { href: "/sob-medida", label: "Monte seu uniforme" },
  { href: "/sob-medida#empresas", label: "Para empresas" },
  { href: "/#sobre", label: "Sobre nós" },
  { href: "/contato", label: "Ajuda" },
];

function Announcement() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % announcements.length), 4200);
    return () => window.clearInterval(t);
  }, [paused]);
  const { Icon, text } = announcements[i];
  return (
    <div className={s.announce} onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <div className={`container ${s.announceInner}`}>
        <span className={s.announceLeft}>
          <Headset size={14} strokeWidth={1.9} /> {company.hours}
        </span>
        <p className={s.ticker} aria-live="polite">
          <span key={i} className={s.tickerItem}>
            <Icon size={14} /> {text}
          </span>
        </p>
        <span className={s.announceRight}>
          <Link href="/conta#pedidos">
            <PackageSearch size={14} strokeWidth={1.9} /> Acompanhar pedido
          </Link>
        </span>
      </div>
    </div>
  );
}

function CartButton({ compact = false }: { compact?: boolean }) {
  const { ready, summary, openDrawer, drawer } = useStore();
  const count = ready ? summary.items : 0;
  return (
    <button
      type="button"
      className={s.cartBtn}
      data-compact={compact || undefined}
      aria-label={`Abrir carrinho${count ? `, ${count} peças` : ""}`}
      aria-expanded={drawer === "cart"}
      onClick={() => openDrawer("cart")}
    >
      <span className={s.cartIcon}>
        <ShoppingBag size={21} strokeWidth={1.75} />
        {count > 0 && (
          <span key={count} className={s.badge}>
            {count > 999 ? "999+" : count}
          </span>
        )}
      </span>
      {!compact && (
        <span className={s.cartText}>
          <small>Carrinho</small>
          <b>{ready && summary.subtotal > 0 ? money(summary.subtotal) : "Vazio"}</b>
        </span>
      )}
    </button>
  );
}

export function Header() {
  const { ready, favorites, openDrawer, drawer } = useStore();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const megaBtn = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);

  // encolhe ao rolar (com histerese para não oscilar)
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled((was) => (was ? y > 40 : y > 120));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // fecha painéis ao trocar de rota
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMega(false);
    setMobileSearch(false);
  }

  const closeMega = useCallback(() => {
    window.clearTimeout(timer.current);
    setMega(false);
  }, []);
  const hoverOpen = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMega(true), 90);
  };
  const hoverClose = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMega(false), 160);
  };
  useDismiss([navRef], mega, () => {
    closeMega();
  });
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const favCount = ready ? favorites.length : 0;
  const isActive = (href: string) => {
    const path = href.split("#")[0];
    return path !== "/" && !href.includes("#") && pathname.startsWith(path);
  };

  return (
    <header className={s.header} data-scrolled={scrolled || undefined}>
      <Announcement />

      <div className={s.bar}>
        {/* ---------- desktop ---------- */}
        <div className={`container ${s.main}`}>
          <Logo height={scrolled ? 34 : 42} className={s.logo} />
          <SearchBox shortcut className={s.search} />
          <div className={s.actions}>
            <a className={s.action} data-icon="help" href={whatsappLink("Olá! Vim pelo site e gostaria de atendimento.")} target="_blank" rel="noopener noreferrer">
              <Headset size={21} strokeWidth={1.75} />
              <span>Atendimento</span>
            </a>
            <button type="button" className={s.action} data-icon="fav" aria-label={`Favoritos${favCount ? `, ${favCount} itens` : ""}`} aria-expanded={drawer === "favorites"} onClick={() => openDrawer("favorites")}>
              <span className={s.cartIcon}>
                <Heart size={21} strokeWidth={1.75} />
                {favCount > 0 && <span key={favCount} className={s.badge} data-tone="fav">{favCount}</span>}
              </span>
              <span>Favoritos</span>
            </button>
            <ProfileMenu />
            <ThemeToggle />
            <CartButton />
          </div>
        </div>

        {/* ---------- mobile ---------- */}
        <div className={`container ${s.mobile}`}>
          <button type="button" className="icon-btn" aria-label="Abrir menu" aria-expanded={drawer === "menu"} onClick={() => openDrawer("menu")}>
            <Menu size={22} strokeWidth={1.9} />
          </button>
          <Logo height={30} className={s.mobileLogo} />
          <div className={s.mobileActions}>
            <button
              type="button"
              className="icon-btn"
              aria-label={mobileSearch ? "Fechar busca" : "Abrir busca"}
              aria-expanded={mobileSearch}
              aria-controls="mobile-search"
              onClick={() => setMobileSearch((v) => !v)}
            >
              {mobileSearch ? <X size={21} /> : <Search size={21} strokeWidth={1.9} />}
            </button>
            <CartButton compact />
          </div>
        </div>
        <div id="mobile-search" className={s.mobileSearch} data-open={mobileSearch || undefined} inert={!mobileSearch}>
          <div className={s.mobileSearchInner}>
            <div className="container">{mobileSearch && <SearchBox size="md" autoFocus onNavigate={() => setMobileSearch(false)} />}</div>
          </div>
        </div>
      </div>

      {/* ---------- barra navy ---------- */}
      <nav
        ref={navRef}
        className={s.nav}
        aria-label="Principal"
        onKeyDown={(e) => {
          if (e.key === "Escape" && mega) {
            closeMega();
            megaBtn.current?.focus();
          }
        }}
        onPointerLeave={(e) => e.pointerType === "mouse" && hoverClose()}>
        <div className={`container ${s.navInner}`}>
          <ul className={s.navList}>
            <li onPointerEnter={(e) => e.pointerType === "mouse" && hoverOpen()}>
              <button
                ref={megaBtn}
                type="button"
                className={s.navLink}
                aria-expanded={mega}
                aria-controls="mega-produtos"
                data-active={mega || pathname.startsWith("/loja") || pathname.startsWith("/produto") || undefined}
                onClick={() => setMega((v) => !v)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setMega(true);
                    requestAnimationFrame(() => document.querySelector<HTMLElement>("#mega-produtos a")?.focus());
                  }
                }}
              >
                Produtos <ChevronDown size={15} className={s.chev} />
              </button>
            </li>
            {navLinks.map((l) => (
              <li key={l.href} onPointerEnter={(e) => e.pointerType === "mouse" && mega && hoverClose()}>
                <Link href={l.href} className={s.navLink} data-active={isActive(l.href) || undefined} aria-current={isActive(l.href) ? "page" : undefined}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className={s.seals} aria-label="Diferenciais">
            <li><Factory size={16} strokeWidth={1.75} /> Produção própria</li>
            <li><Truck size={16} strokeWidth={1.75} /> Entrega para todo o Brasil</li>
            <li><BadgeCheck size={16} strokeWidth={1.75} /> A partir de 5 peças</li>
          </ul>
        </div>
        <div onPointerEnter={() => window.clearTimeout(timer.current)}>
          <MegaMenu
            id="mega-produtos"
            open={mega}
            onNavigate={() => {
              closeMega();
            }}
          />
        </div>
        <div className={s.scrim} data-open={mega || undefined} aria-hidden />
      </nav>
    </header>
  );
}
