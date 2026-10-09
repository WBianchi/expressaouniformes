import Link from "next/link";
import s from "./Logo.module.css";

/** Logo com troca claro/escuro via CSS (sem JS, sem flash). `onDark` força a versão branca. */
export function Logo({ height = 40, onDark = false, className, onClick }: { height?: number; onDark?: boolean; className?: string; onClick?: () => void }) {
  const w = Math.round((428 / 100) * height);
  return (
    <Link
      href="/"
      className={`${s.logo} ${className ?? ""}`}
      aria-label="Expressão Uniformes — página inicial"
      data-on-dark={onDark || undefined}
      style={{ "--logo-h": `${height}px` } as React.CSSProperties}
      onClick={onClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={s.light} src="/images/logo-on-light.png" alt="" width={w} height={height} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={s.dark} src="/images/logo-on-dark.png" alt="" width={w} height={height} />
    </Link>
  );
}
