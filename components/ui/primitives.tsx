"use client";
import { Minus, Plus, Star, Shirt, Ruler, Stethoscope, CloudSun, HardHat, ChefHat, TriangleAlert, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getColor, money } from "@/lib/catalog";
import s from "./ui.module.css";

export const categoryIcons: Record<string, LucideIcon> = { Shirt, Ruler, Stethoscope, CloudSun, HardHat, ChefHat, TriangleAlert };
export function CategoryIcon({ name, size = 20 }: { name: string; size?: number }) {
  const I = categoryIcons[name] ?? Shirt;
  return <I size={size} strokeWidth={1.75} />;
}

/** Imagem com placeholder elegante enquanto o arquivo não existe ou carrega. */
export function SafeImage({ src, alt, className, fill = true, priority }: { src: string; alt: string; className?: string; fill?: boolean; priority?: boolean }) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const imgRef = useRef<HTMLImageElement>(null);
  // Imagem já em cache pode terminar antes da hidratação e não disparar onLoad.
  useEffect(() => {
    const el = imgRef.current;
    if (el?.complete) setState(el.naturalWidth ? "ok" : "error");
  }, [src]);
  return (
    <span className={`${s.safeImage} ${className ?? ""}`} data-state={state} data-fill={fill || undefined}>
      {state !== "error" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          onLoad={() => setState("ok")}
          onError={() => setState("error")}
          ref={imgRef}
        />
      )}
      {state === "error" && (
        <span className={s.imageFallback} aria-hidden>
          <Shirt size={44} strokeWidth={1.2} />
        </span>
      )}
    </span>
  );
}

export function Swatches({
  ids,
  value,
  onChange,
  size = "md",
  max,
}: {
  ids: string[];
  value?: string;
  onChange?: (id: string) => void;
  size?: "sm" | "md" | "lg";
  max?: number;
}) {
  const shown = max ? ids.slice(0, max) : ids;
  return (
    <div className={s.swatches} data-size={size} role={onChange ? "radiogroup" : undefined} aria-label="Cores">
      {shown.map((id) => {
        const c = getColor(id);
        if (!c) return null;
        const El = onChange ? "button" : "span";
        return (
          <El
            key={id}
            className={s.swatch}
            style={{ "--sw": c.hex } as React.CSSProperties}
            data-active={value === id || undefined}
            data-light={["branco", "amarelo", "limao", "celeste"].includes(id) || undefined}
            title={c.name}
            {...(onChange
              ? { type: "button" as const, role: "radio", "aria-checked": value === id, "aria-label": c.name, onClick: () => onChange(id) }
              : { "aria-label": c.name })}
          />
        );
      })}
      {max && ids.length > max && <span className={s.swatchMore}>+{ids.length - max}</span>}
    </div>
  );
}

export function Price({ value, compareAt, unit = "un.", size = "md", prefix }: { value: number; compareAt?: number; unit?: string; size?: "sm" | "md" | "lg"; prefix?: string }) {
  return (
    <div className={s.price} data-size={size}>
      {prefix && <small className={s.pricePrefix}>{prefix}</small>}
      <div className={s.priceRow}>
        <strong>{money(value)}</strong>
        {unit && <span>/{unit}</span>}
        {compareAt && compareAt > value && <del>{money(compareAt)}</del>}
      </div>
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, max = 9999, step = 1, size = "md", label }: { value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number; size?: "sm" | "md"; label?: string }) {
  const clamp = (n: number) => Math.max(min, Math.min(max, Number.isFinite(n) ? Math.round(n) : min));
  return (
    <div className={s.stepper} data-size={size}>
      <button type="button" aria-label={`Diminuir ${label ?? ""}`} onClick={() => onChange(clamp(value - step))} disabled={value <= min}>
        <Minus size={14} />
      </button>
      <input
        inputMode="numeric"
        aria-label={label ?? "Quantidade"}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value.replace(/\D/g, "")) || 0))}
        onFocus={(e) => e.target.select()}
      />
      <button type="button" aria-label={`Aumentar ${label ?? ""}`} onClick={() => onChange(clamp(value + step))} disabled={value >= max}>
        <Plus size={14} />
      </button>
    </div>
  );
}

export function Rating({ value, reviews }: { value: number; reviews?: number }) {
  return (
    <span className={s.rating} aria-label={`Nota ${value} de 5`}>
      <Star size={13} fill="currentColor" />
      <b>{value.toFixed(1)}</b>
      {reviews !== undefined && <span>({reviews})</span>}
    </span>
  );
}

export function SectionHeader({ eyebrow, title, subtitle, action, align = "left" }: { eyebrow?: ReactNode; title: ReactNode; subtitle?: ReactNode; action?: ReactNode; align?: "left" | "center" }) {
  return (
    <div className={s.sectionHeader} data-align={align}>
      <div>
        {eyebrow && <span className={s.eyebrow}>{eyebrow}</span>}
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
