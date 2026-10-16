"use client";
import Link from "next/link";
import { ArrowRight, ChevronRight, FileCheck2, Heart, LogIn, LogOut, Package, Sparkles, UserRound } from "lucide-react";
import { categories, company, whatsappLink } from "@/lib/catalog";
import { useStore } from "@/components/store/StoreProvider";
import { Drawer } from "@/components/ui/Drawer";
import { CategoryIcon } from "@/components/ui/primitives";
import { SearchBox } from "./SearchBox";
import { ThemeSegment } from "./ThemeToggle";
import { WhatsAppIcon } from "./icons";
import { navLinks } from "./Header";
import { firstName, initials, useProfile } from "./useProfile";
import s from "./MobileMenu.module.css";

/** Menu lateral do mobile: busca, categorias, links, tema e conta. */
export function MobileMenu() {
  const { drawer, openDrawer, closeDrawer, ready, favorites } = useStore();
  const open = drawer === "menu";
  const { profile, signOut } = useProfile();

  return (
    <Drawer open={open} onOpenChange={(o) => (o ? openDrawer("menu") : closeDrawer())} title="Menu" side="left" width={380}>
      <div className={s.wrap}>
        <SearchBox inline size="md" onNavigate={closeDrawer} className={s.search} />

        <div className={s.account}>
          <span className={s.avatar}>{profile ? initials(profile.name) : <UserRound size={20} strokeWidth={1.75} />}</span>
          <div>
            <b>{profile ? `Olá, ${firstName(profile.name)}` : "Olá, visitante"}</b>
            <small>{profile ? profile.email : "Entre para acompanhar pedidos"}</small>
          </div>
          {profile ? (
            <Link href="/conta" className="btn btn-outline btn-sm" onClick={closeDrawer}>
              Conta
            </Link>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm" onClick={closeDrawer}>
              <LogIn size={15} /> Entrar
            </Link>
          )}
        </div>

        <div className={s.modes}>
          <Link href="/loja?tipo=stock" className={s.mode} data-tone="stock" onClick={closeDrawer}>
            <Package size={20} strokeWidth={1.75} />
            <b>Pronta-entrega</b>
            <small>A partir de 5 peças</small>
          </Link>
          <Link href="/orcamento" className={s.mode} data-tone="custom" onClick={closeDrawer}>
            <Sparkles size={20} strokeWidth={1.75} />
            <b>Monte seu pedido</b>
            <small>A partir de 30 peças</small>
          </Link>
        </div>

        <section>
          <h3 className={s.label}>Categorias</h3>
          <ul className={s.cats}>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/loja?categoria=${c.slug}`} onClick={closeDrawer}>
                  <span className={s.catIcon}><CategoryIcon name={c.icon} size={18} /></span>
                  {c.name}
                  <ChevronRight size={16} className={s.chev} />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className={s.label}>Navegação</h3>
          <ul className={s.links}>
            <li><Link href="/loja" onClick={closeDrawer}>Todos os produtos <ChevronRight size={16} className={s.chev} /></Link></li>
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={closeDrawer}>{l.label} <ChevronRight size={16} className={s.chev} /></Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className={s.label}>Minha conta</h3>
          <ul className={s.links}>
            <li><Link href="/conta" onClick={closeDrawer}><UserRound size={17} strokeWidth={1.75} /> Minha conta <ChevronRight size={16} className={s.chev} /></Link></li>
            <li><Link href="/conta#pedidos" onClick={closeDrawer}><Package size={17} strokeWidth={1.75} /> Meus pedidos <ChevronRight size={16} className={s.chev} /></Link></li>
            <li><Link href="/conta#layout" onClick={closeDrawer}><FileCheck2 size={17} strokeWidth={1.75} /> Aprovar layout <ChevronRight size={16} className={s.chev} /></Link></li>
            <li>
              <button type="button" onClick={() => openDrawer("favorites")}>
                <Heart size={17} strokeWidth={1.75} /> Favoritos
                {ready && favorites.length > 0 && <span className={s.count}>{favorites.length}</span>}
                <ChevronRight size={16} className={s.chev} />
              </button>
            </li>
            {profile && (
              <li>
                <button type="button" className={s.signOut} onClick={() => { signOut(); closeDrawer(); }}>
                  <LogOut size={17} strokeWidth={1.75} /> Sair
                </button>
              </li>
            )}
          </ul>
        </section>

        <section>
          <h3 className={s.label}>Aparência</h3>
          <ThemeSegment />
        </section>

        <a className={`btn btn-whatsapp btn-block ${s.wa}`} href={whatsappLink("Olá! Vim pelo site e gostaria de falar com um consultor.")} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon size={20} /> Falar com um consultor <ArrowRight size={18} />
        </a>
        <p className={s.hours}>{company.hours}</p>
      </div>
    </Drawer>
  );
}
