"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useRef, useState } from "react";
import { inStock, type Position, type Product } from "@/lib/catalog";
import type { View } from "@/lib/mockup";
import { SafeImage } from "@/components/ui/primitives";
import { useProductPhotos } from "@/components/store/MediaProvider";
import { LogoMockup } from "./LogoMockup";
import s from "./Gallery.module.css";

/** Slide da galeria: fotos com modelo ("photo-N") e as vistas do simulador de logo. */
export type Slide = View | `photo-${number}`;

/**
 * Fotos com modelos (vitrine) + frente e costas da peça com a logo do cliente
 * aplicada nas posições escolhidas (simulador).
 */
export function Gallery({
  product,
  positions = [],
  logo,
  view: controlled,
  onViewChange,
}: {
  product: Product;
  positions?: Position[];
  logo?: string | null;
  view?: Slide;
  onViewChange?: (v: Slide) => void;
}) {
  const photos = useProductPhotos()(product);
  const VIEWS: { id: Slide; label: string; src?: string }[] = [
    ...photos.slice(0, 1).map((src) => ({ id: "photo-0" as Slide, label: "Foto", src })),
    { id: "front", label: "Frente" },
    { id: "back", label: "Costas" },
    ...photos.slice(1).map((src, i) => ({ id: `photo-${i + 1}` as Slide, label: "Foto", src })),
  ];
  const [own, setOwn] = useState<Slide>(VIEWS[0].id);
  const view = controlled ?? own;
  const setView = (v: Slide) => (onViewChange ? onViewChange(v) : setOwn(v));
  const [open, setOpen] = useState(false);
  const touch = useRef<number | null>(null);
  const index = Math.max(0, VIEWS.findIndex((v) => v.id === view));
  const current = VIEWS[index];
  const isMock = current.id === "front" || current.id === "back";
  const go = (d: number) => setView(VIEWS[(index + d + VIEWS.length) % VIEWS.length].id);
  const available = inStock(product);
  const badge =
    product.kind === "custom" ? "Sob encomenda" : available ? "Pronta-entrega" : "Sem estoque";

  const render = (v: (typeof VIEWS)[number], priority?: boolean) =>
    v.src ? (
      <SafeImage src={v.src} alt={`${product.name} vestida por modelo`} priority={priority} className={s.photo} />
    ) : (
      <LogoMockup product={product} view={v.id as View} positions={positions} logo={logo?.length ? logo : null} priority={priority} markers={!!positions.length} />
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
            {render(v, v.id === VIEWS[0].id)}
          </div>
        ))}

        <span className={s.badge} data-tone={available ? "ok" : product.kind === "custom" ? "brand" : "muted"}>
          {badge}
        </span>
        {isMock && logo && positions.length > 0 && <span className={s.previewTag}>Prévia com a sua logo</span>}

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
