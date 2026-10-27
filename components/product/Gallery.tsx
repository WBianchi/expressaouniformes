"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useRef, useState } from "react";
import { inStock, type Position, type Product } from "@/lib/catalog";
import type { Placement, Placements, View } from "@/lib/mockup";
import { LogoMockup } from "./LogoMockup";
import s from "./Gallery.module.css";

/** Slide da galeria: frente, costas e lado da peça (simulador de logo). Sem fotos com modelo aqui, a pedido do cliente. */
export type Slide = View;

/** Frente, costas e lado da peça, com a logo de cada posição aplicada (simulador). */
export function Gallery({
  product,
  positions = [],
  logos = {},
  placements,
  onPlace,
  view: controlled,
  onViewChange,
}: {
  product: Product;
  positions?: Position[];
  logos?: Partial<Record<Position, string>>;
  placements?: Placements;
  /** arrastar a logo na foto principal */
  onPlace?: (position: Position, placement: Placement) => void;
  view?: Slide;
  onViewChange?: (v: Slide) => void;
}) {
  const VIEWS: { id: Slide; label: string }[] = [
    { id: "front", label: "Frente" },
    { id: "back", label: "Costas" },
    { id: "side", label: "Lado" },
  ];
  const [own, setOwn] = useState<Slide>(VIEWS[0].id);
  const view = controlled ?? own;
  const setView = (v: Slide) => (onViewChange ? onViewChange(v) : setOwn(v));
  const [open, setOpen] = useState(false);
  const touch = useRef<number | null>(null);
  const index = Math.max(0, VIEWS.findIndex((v) => v.id === view));
  const current = VIEWS[index];
  const go = (d: number) => setView(VIEWS[(index + d + VIEWS.length) % VIEWS.length].id);
  const available = inStock(product);
  const badge =
    product.kind === "custom" ? "Sob encomenda" : available ? "Pronta-entrega" : "Sob cotação";

  const render = (v: (typeof VIEWS)[number], priority?: boolean, editable?: boolean) => (
    <LogoMockup
      product={product}
      view={v.id}
      positions={positions}
      logos={logos}
      placements={placements}
      onPlace={editable ? onPlace : undefined}
      priority={priority}
      markers={!!positions.length}
    />
  );

  return (
    <div className={s.gallery}>
      <div
        className={s.stage}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        {VIEWS.map((v) => (
          <div key={v.id} className={s.slide} data-active={v.id === current.id || undefined} aria-hidden={v.id !== current.id}>
            {render(v, v.id === VIEWS[0].id, true)}
          </div>
        ))}

        <span className={s.badge} data-tone={available ? "ok" : product.kind === "custom" ? "brand" : "muted"}>
          {badge}
        </span>
        {positions.some((p) => logos[p]) && <span className={s.previewTag}>{onPlace ? "Arraste a logo para posicionar" : "Prévia com a sua logo"}</span>}

        <button type="button" className={s.toolBtn} onClick={() => setOpen(true)} aria-label="Ampliar imagem">
          <Expand size={17} />
        </button>
        <button type="button" className={s.navBtn} data-dir="prev" onClick={() => go(-1)} aria-label="Imagem anterior">
          <ChevronLeft size={20} />
        </button>
        <button type="button" className={s.navBtn} data-dir="next" onClick={() => go(1)} aria-label="Próxima imagem">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className={s.thumbs} role="group" aria-label="Vistas do produto">
        {VIEWS.map((v) => (
          <button key={v.id} type="button" className={s.thumb} aria-current={v.id === current.id || undefined} onClick={() => setView(v.id)}>
            <span className={s.thumbImg}>{render(v)}</span>
            <span className={s.thumbLabel}>{v.label}</span>
          </button>
        ))}
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={s.lbOverlay} />
          <Dialog.Content
            className={s.lightbox}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") go(1);
              if (e.key === "ArrowLeft") go(-1);
            }}
          >
            <Dialog.Title className="sr-only">{product.name}</Dialog.Title>
            <Dialog.Description className="sr-only">Imagem ampliada. Use as setas do teclado para alternar as fotos.</Dialog.Description>
            <div className={s.lbHead}>
              <span>{current.label}</span>
              <Dialog.Close className={s.lbClose} aria-label="Fechar">
                <X size={22} />
              </Dialog.Close>
            </div>
            <div className={s.lbStage}>
              {render(current)}
              <button type="button" className={s.navBtn} data-dir="prev" data-show onClick={() => go(-1)} aria-label="Imagem anterior">
                <ChevronLeft size={22} />
              </button>
              <button type="button" className={s.navBtn} data-dir="next" data-show onClick={() => go(1)} aria-label="Próxima imagem">
                <ChevronRight size={22} />
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
