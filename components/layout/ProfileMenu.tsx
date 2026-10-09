"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, FileCheck2, Heart, LogIn, LogOut, Package, UserRound, UserRoundPlus } from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";
import { ThemeSegment } from "./ThemeToggle";
import { useDismiss } from "./hooks";
import { firstName, initials, useProfile } from "./useProfile";
import s from "./ProfileMenu.module.css";

/** Menu de perfil expansível (popover). */
export function ProfileMenu() {
  const { openDrawer, favorites, ready } = useStore();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { profile, signOut } = useProfile();
  const close = useCallback(() => setOpen(false), []);
  useDismiss([wrap], open, () => {
    setOpen(false);
  });
  // fecha ao navegar
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  // devolve o foco ao botão quando fecha com Esc
  useEffect(() => {
    if (open) return;
    if (wrap.current?.contains(document.activeElement)) btn.current?.focus();
  }, [open]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div ref={wrap} className={s.wrap}>
      <button
        ref={btn}
        type="button"
        className={s.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="profile-menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={s.avatar} data-user={profile ? true : undefined}>
          {profile ? initials(profile.name) : <UserRound size={19} strokeWidth={1.75} />}
        </span>
        <span className={s.triggerText}>
          <small>{profile ? `Olá, ${firstName(profile.name)}` : "Olá, visitante"}</small>
          <b>
            {profile ? "Minha conta" : "Entrar / Cadastrar"} <ChevronDown size={14} className={s.chev} />
          </b>
        </span>
      </button>

      <div id="profile-menu" role="dialog" aria-label="Menu da conta" className={s.panel} data-open={open || undefined} hidden={!open}>
        <div className={s.head}>
          <span className={s.headAvatar}>{profile ? initials(profile.name) : <UserRound size={22} strokeWidth={1.75} />}</span>
          <div>
            <b suppressHydrationWarning>
              {greeting}
              {profile ? `, ${firstName(profile.name)}` : ""}!
            </b>
            {profile ? <p className={s.email}>{profile.email}</p> : <p>Entre para acompanhar pedidos e aprovar seus layouts.</p>}
          </div>
        </div>
        {!profile && (
          <div className={s.authRow}>
            <Link href="/login" className="btn btn-primary btn-sm" onClick={close}>
              <LogIn size={16} /> Entrar
            </Link>
            <Link href="/login" className="btn btn-outline btn-sm" onClick={close}>
              <UserRoundPlus size={16} /> Cadastrar
            </Link>
          </div>
        )}
        <nav className={s.links} aria-label="Conta">
          <Link href="/conta" onClick={close}>
            <UserRound size={18} strokeWidth={1.75} /> Minha conta
          </Link>
          <Link href="/conta#pedidos" onClick={close}>
            <Package size={18} strokeWidth={1.75} /> Meus pedidos
          </Link>
          <Link href="/conta#layout" onClick={close}>
            <FileCheck2 size={18} strokeWidth={1.75} /> Aprovar layout
          </Link>
          <button
            type="button"
            onClick={() => {
              close();
              openDrawer("favorites");
            }}
          >
            <Heart size={18} strokeWidth={1.75} /> Favoritos
            {ready && favorites.length > 0 && <span className={s.count}>{favorites.length}</span>}
          </button>
          {profile && (
            <button
              type="button"
              className={s.signOut}
              onClick={() => {
                close();
                signOut();
                toast("Você saiu da sua conta");
              }}
            >
              <LogOut size={18} strokeWidth={1.75} /> Sair
            </button>
          )}
        </nav>
        <div className={s.theme}>
          <span>Aparência</span>
          <ThemeSegment />
        </div>
      </div>
    </div>
  );
}
