"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Expand, Package, Sparkles, X, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { Product } from "@/lib/catalog";
import { SafeImage } from "@/components/ui/primitives";
import s from "./Gallery.module.css";

type View = { src: string; label: string; zoom: number; origin: string };

/** Monta as vistas da galeria. Enquanto houver uma só foto, cria recortes de detalhe (gola e tecido). */
function buildViews(p: Product): View[] {
  const srcs = Array.from(new Set([p.image, ...p.gallery]));
  const views: View[] = srcs.map((src, i) => ({ src, label: i === 0 ? "Vista frontal" : `Foto ${i + 1}`, zoom: 1, origin: "50% 50%" }));
  if (views.length < 3) {
    views.push(
      { src: p.image, label: p.category === "calcas" ? "Detalhe do cós" : "Detalhe da gola", zoom: 2.2, origin: "50% 14%" },
      { src: p.image, label: "Textura do tecido", zoom: 3.2, origin: "38% 62%" },
    );
  }
  return views;
}

const LENS = 170;
const MAG = 2.4;

export function Gallery({ product }: { product: Product }) {
  const views = buildViews(product);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [lens, setLens] = useState<{ x: number; y: number; bg: string; size: string } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);
  const view = views[index];
  const stock = product.kind === "stock";
  const off = product.compareAt && product.compareAt > product.price ? Math.round((1 - product.price / product.compareAt) * 100) : 0;

  // pré-carrega para habilitar a lente apenas quando a foto existir
  useEffect(() => {
    const img = new Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setNatural(null);
    img.src = product.image;
  }, [product.image]);

  const go = (d: number) => setIndex((i) => (i + d + views.length) % views.length);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || !natural || view.zoom !== 1 || !stage.current) return;
    const r = stage.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const scale = Math.max(r.width / natural.w, r.height / natural.h); // object-fit: cover
    const rw = natural.w * scale;
    const rh = natural.h * scale;
    const ox = (r.width - rw) / 2;
    const oy = (r.height - rh) / 2;
    setLens({
      x,
      y,
      size: `${rw * MAG}px ${rh * MAG}px`,
      bg: `${-((x - ox) * MAG - LENS / 2)}px ${-((y - oy) * MAG - LENS / 2)}px`,
    });
  }

  return (
    <div className={s.gallery}>
      <div
        ref={stage}
        className={s.stage}
        data-lens={(natural && view.zoom === 1) || undefined}
        onPointerMove={onMove}
        onPointerLeave={() => setLens(null)}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        {views.map((v, i) => (
          <div
            key={i}
            className={s.slide}
            data-active={i === index || undefined}
            aria-hidden={i !== index}
            style={{ "--z": v.zoom, "--o": v.origin } as CSSProperties}
          >
            <SafeImage src={v.src} alt={i === index ? `${product.name} — ${v.label}` : ""} priority={i === 0} />
          </div>
        ))}

        <button type="button" className={s.openBtn} onClick={() => setOpen(true)} aria-label="Ampliar imagem">
          <span className={s.badges}>
            {stock ? (
              <span className="chip chip-success"><Package size={12} /> Pronta para personalizar</span>
            ) : (
              <span className="chip chip-brand"><Sparkles size={12} /> Produção sob medida</span>
            )}
            {product.badge && <span className="chip chip-gold">{product.badge}</span>}
            {off > 0 && <span className={`chip ${s.offChip}`}>-{off}%</span>}
          </span>
        </button>

        {lens && (
          <span
            className={s.lens}
            aria-hidden
            style={{
              width: LENS,
              height: LENS,
              transform: `translate(${lens.x - LENS / 2}px, ${lens.y - LENS / 2}px)`,
              backgroundImage: `url(${product.image})`,
              backgroundSize: lens.size,
              backgroundPosition: lens.bg,
            }}
          />
        )}

        <div className={s.stageTools}>
          <span className={s.hint} aria-hidden><ZoomIn size={14} /> {view.zoom === 1 ? "Passe o mouse para ampliar" : view.label}</span>
          <button type="button" className={s.toolBtn} onClick={() => setOpen(true)} aria-label="Abrir em tela cheia">
            <Expand size={17} />
          </button>
        </div>
        {views.length > 1 && (
          <>
            <button type="button" className={s.navBtn} data-dir="prev" onClick={() => go(-1)} aria-label="Imagem anterior"><ChevronLeft size={20} /></button>
            <button type="button" className={s.navBtn} data-dir="next" onClick={() => go(1)} aria-label="Próxima imagem"><ChevronRight size={20} /></button>
            <div className={s.dots} aria-hidden>
              {views.map((_, i) => <span key={i} data-active={i === index || undefined} />)}
            </div>
          </>
        )}
      </div>

      {views.length > 1 && (
        <div className={s.thumbs} role="group" aria-label="Imagens do produto">
          {views.map((v, i) => (
            <button
              key={i}
              type="button"
              aria-current={i === index || undefined}
              aria-label={v.label}
              className={s.thumb}
              style={{ "--z": v.zoom, "--o": v.origin } as CSSProperties}
              onClick={() => setIndex(i)}
            >
              <SafeImage src={v.src} alt="" />
            </button>
          ))}
        </div>
      )}

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
            <Dialog.Description className="sr-only">Galeria ampliada. Use as setas do teclado para navegar.</Dialog.Description>
            <div className={s.lbHead}>
              <span>{view.label} <small>{index + 1} / {views.length}</small></span>
              <Dialog.Close className={s.lbClose} aria-label="Fechar"><X size={22} /></Dialog.Close>
            </div>
            <div className={s.lbStage} style={{ "--z": view.zoom, "--o": view.origin } as CSSProperties}>
              <SafeImage key={index} src={view.src} alt={`${product.name} — ${view.label}`} />
              {views.length > 1 && (
                <>
                  <button type="button" className={s.navBtn} data-dir="prev" data-show onClick={() => go(-1)} aria-label="Imagem anterior"><ChevronLeft size={22} /></button>
                  <button type="button" className={s.navBtn} data-dir="next" data-show onClick={() => go(1)} aria-label="Próxima imagem"><ChevronRight size={22} /></button>
                </>
              )}
            </div>
            <div className={s.lbThumbs}>
              {views.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  className={s.thumb}
                  aria-label={v.label}
                  aria-current={i === index || undefined}
                  style={{ "--z": v.zoom, "--o": v.origin } as CSSProperties}
                  onClick={() => setIndex(i)}
                >
                  <SafeImage src={v.src} alt="" />
                </button>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
