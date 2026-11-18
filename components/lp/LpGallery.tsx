"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { SafeImage } from "@/components/ui/primitives";
import { colorModelPhotos } from "@/lib/listing";
import { useRecolored } from "@/lib/recolor";
import { useLpColor } from "./LpParts";
import s from "./Landing.module.css";

type LpImage = { src: string; label: string; /** foto da peça sozinha: muda de cor com o seletor */ piece?: boolean };

/** Foto da peça pintada na cor escolhida (a da pessoa vestindo fica como está). */
function Photo({ im, alt, priority, tint }: { im: LpImage; alt: string; priority?: boolean; tint: string | null }) {
  const src = useRecolored(im.src, im.piece ? tint : null);
  return <SafeImage src={src} alt={alt} priority={priority} />;
}

const ZOOM = 2.5;

/**
 * Galeria da landing page (estilo marketplace): foto principal grande e miniaturas
 * embaixo. Fotos do anúncio, na ordem do painel; a foto vestindo da cor escolhida vem primeiro.
 * Clique (ou toque) na foto abre a foto ampliada, com zoom para ver os detalhes.
 */
export function LpGallery({
  images: base,
  name,
  colorPhotos,
  photoColors,
}: {
  images: LpImage[];
  name: string;
  colorPhotos?: Record<string, string[]>;
  /** cor marcada em cada foto da galeria (painel): escolher a cor leva para a foto dela */
  photoColors?: Record<string, string>;
}) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const lp = useLpColor();
  const tint = lp?.tint ?? null;
  // cor com fotos vestindo próprias (enviadas no painel): elas vão para a frente da galeria e
  // as outras fotos do anúncio continuam depois delas (só a foto principal muda)
  const own = lp ? colorModelPhotos(colorPhotos?.[lp.color]) : [];
  const images = useMemo<LpImage[]>(
    () =>
      own.length
        ? [...own.map((src, k) => ({ src, label: k ? "vestindo, costas" : "vestindo, frente" })), ...base.filter((im) => !own.includes(im.src))]
        : base,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [own.join("|"), base],
  );
  const hasOwn = own.length > 0;
  const color = lp?.color;
  // ao escolher outra cor (não ao abrir a página): a foto vestindo da cor, se houver; senão a foto da
  // galeria marcada com essa cor no painel; senão a peça sozinha (quando houver; é ela que muda de cor)
  const lastColor = useRef(color);
  useEffect(() => {
    if (lastColor.current === color) return;
    lastColor.current = color;
    if (hasOwn) return setI(0);
    const tagged = color ? images.findIndex((im) => photoColors?.[im.src] === color) : -1;
    if (tagged >= 0) return setI(tagged);
    if (!tint) return;
    setI((cur) => (images[cur]?.piece || !images.some((im) => im.piece) ? cur : images.findIndex((im) => im.piece)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);
  const touch = useRef<number | null>(null);
  const thumbs = useRef<HTMLUListElement>(null);
  const go = (d: number) => setI((cur) => (cur + d + images.length) % images.length);
  const index = Math.min(i, images.length - 1);
  const current = images[index];

  // miniatura da foto atual sempre à vista (muitas fotos rolam para o lado)
  useEffect(() => {
    const el = thumbs.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [index]);

  return (
    <div className={s.gallery}>
      <div
        className={s.stage}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          touch.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        {images.map((im, k) => (
          <button
            type="button"
            key={im.src}
            className={s.slide}
            data-active={k === index || undefined}
            aria-hidden={k !== index}
            tabIndex={k === index ? 0 : -1}
            onClick={() => setOpen(true)}
            aria-label={`Ampliar foto ${k + 1}: ${im.label}`}
          >
            <Photo im={im} alt={`${name}: ${im.label}`} priority={k === 0} tint={tint} />
          </button>
        ))}
        {images.length > 1 && (
          <>
            <button type="button" className={s.nav} data-dir="prev" onClick={() => go(-1)} aria-label="Foto anterior">
              <ChevronLeft size={30} strokeWidth={2.4} />
            </button>
            <button type="button" className={s.nav} data-dir="next" onClick={() => go(1)} aria-label="Próxima foto">
              <ChevronRight size={30} strokeWidth={2.4} />
            </button>
          </>
        )}
      </div>
      <ul ref={thumbs} className={s.thumbs} aria-label="Fotos do produto">
        {images.map((im, k) => (
          <li key={im.src}>
            <button
              type="button"
              className={s.thumb}
              aria-current={k === index || undefined}
              aria-label={`Ver foto ${k + 1}: ${im.label}`}
              onMouseEnter={() => setI(k)}
              onFocus={() => setI(k)}
              onClick={() => setI(k)}
            >
              <Photo im={im} alt="" tint={tint} />
            </button>
          </li>
        ))}
      </ul>

      <Lightbox open={open} onOpenChange={setOpen} images={images} index={index} go={go} name={name} tint={tint} />
    </div>
  );
}

/** Foto ampliada em tela cheia: setas, deslizar no celular e zoom no ponto tocado (arrastar para ver o resto). */
function Lightbox({
  open,
  onOpenChange,
  images,
  index,
  go,
  name,
  tint,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  images: LpImage[];
  index: number;
  go: (d: number) => void;
  name: string;
  tint: string | null;
}) {
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const moved = useRef(false);
  const current = images[index];

  // trocou de foto ou fechou: volta sem zoom
  useEffect(() => setZoom(false), [index, open]);

  const at = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)), y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)) };
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={s.lbOverlay} />
        <Dialog.Content
          className={s.lightbox}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(1);
            if (e.key === "ArrowLeft") go(-1);
          }}
        >
          <Dialog.Title className="sr-only">{name}</Dialog.Title>
          <Dialog.Description className="sr-only">Foto ampliada. Toque na foto para aproximar; use as setas ou deslize para trocar de foto.</Dialog.Description>
          <div className={s.lbHead}>
            <span>
              {index + 1}/{images.length} · {current?.label}
            </span>
            <div className={s.lbTools}>
              <button type="button" onClick={() => setZoom((z) => !z)} aria-label={zoom ? "Afastar" : "Aproximar"} aria-pressed={zoom}>
                {zoom ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
              </button>
              <Dialog.Close aria-label="Fechar">
                <X size={22} />
              </Dialog.Close>
            </div>
          </div>
          <div
            className={s.lbStage}
            data-zoom={zoom || undefined}
            onPointerDown={(e) => {
              start.current = { x: e.clientX, y: e.clientY, t: Date.now() };
              moved.current = false;
              if (zoom) setOrigin(at(e));
            }}
            onPointerMove={(e) => {
              const st = start.current;
              if (st && Math.hypot(e.clientX - st.x, e.clientY - st.y) > 8) moved.current = true;
              // com zoom, a foto acompanha o mouse (ou o dedo arrastando) para mostrar cada parte
              if (zoom && (e.pointerType === "mouse" || st)) setOrigin(at(e));
            }}
            onPointerUp={(e) => {
              const st = start.current;
              start.current = null;
              if (!st) return;
              const dx = e.clientX - st.x;
              // deslizar (sem zoom) troca de foto; toque/clique parado liga e desliga o zoom
              if (!zoom && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - st.y)) return go(dx < 0 ? 1 : -1);
              if (!moved.current) {
                setOrigin(at(e));
                setZoom((z) => !z);
              }
            }}
            onPointerCancel={() => (start.current = null)}
          >
            {current && (
              <div className={s.lbImg} style={{ transform: zoom ? `scale(${ZOOM})` : undefined, transformOrigin: `${origin.x}% ${origin.y}%` }}>
                <Photo im={current} alt={`${name}: ${current.label}`} tint={tint} />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <>
              <button type="button" className={s.lbNav} data-dir="prev" onClick={() => go(-1)} aria-label="Foto anterior">
                <ChevronLeft size={26} />
              </button>
              <button type="button" className={s.lbNav} data-dir="next" onClick={() => go(1)} aria-label="Próxima foto">
                <ChevronRight size={26} />
              </button>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
