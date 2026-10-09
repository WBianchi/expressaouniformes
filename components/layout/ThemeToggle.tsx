"use client";
import { Monitor, Moon, Sun } from "lucide-react";
import { useStore, type Theme } from "@/components/store/StoreProvider";
import s from "./ThemeToggle.module.css";

function resolved(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Botão sol/lua. O ícone exibido é decidido por CSS (sem divergência de hidratação). */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useStore();
  return (
    <button
      type="button"
      className={`icon-btn ${s.toggle} ${className ?? ""}`}
      aria-label="Alternar tema claro/escuro"
      title="Alternar tema"
      onClick={() => setTheme(resolved(theme) === "dark" ? "light" : "dark")}
    >
      <Sun className={s.sun} size={20} strokeWidth={1.75} />
      <Moon className={s.moon} size={19} strokeWidth={1.75} />
    </button>
  );
}

const options: { id: Theme; label: string; Icon: typeof Sun }[] = [
  { id: "light", label: "Claro", Icon: Sun },
  { id: "dark", label: "Escuro", Icon: Moon },
  { id: "system", label: "Sistema", Icon: Monitor },
];

/** Seletor segmentado Claro / Escuro / Sistema. */
export function ThemeSegment() {
  const { theme, setTheme } = useStore();
  const idx = options.findIndex((o) => o.id === theme);
  return (
    <div className={s.segment} role="radiogroup" aria-label="Tema" style={{ "--i": idx } as React.CSSProperties}>
      <span className={s.thumb} aria-hidden />
      {options.map(({ id, label, Icon }) => (
        <button key={id} type="button" role="radio" aria-checked={theme === id} data-active={theme === id || undefined} onClick={() => setTheme(id)}>
          <Icon size={15} strokeWidth={1.9} />
          {label}
        </button>
      ))}
    </div>
  );
}
