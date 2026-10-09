import type { CSSProperties, ReactNode } from "react";
import s from "./Marquee.module.css";

/** Faixa com rolagem infinita (o conteúdo é duplicado para o loop). Pausa no hover. */
export function Marquee({
  children,
  label,
  speed = 40,
  reverse,
  tone = "navy",
}: {
  children: ReactNode;
  label: string;
  /** duração de um ciclo em segundos */
  speed?: number;
  reverse?: boolean;
  tone?: "navy" | "plain" | "gold";
}) {
  return (
    <div className={s.marquee} data-tone={tone} data-reverse={reverse || undefined} style={{ "--speed": `${speed}s` } as CSSProperties} role="region" aria-label={label}>
      <div className={s.track}>
        <div className={s.group}>{children}</div>
        <div className={s.group} aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
