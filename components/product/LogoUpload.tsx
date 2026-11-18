"use client";
import { upload } from "@vercel/blob/client";
import { CheckCircle2, ImageUp, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";
import { artContentType, artPath } from "@/lib/art";
import { formatBytes, makeLogoThumb, validateLogo } from "./logoThumb";
import s from "./Product.module.css";

/** url: arquivo original guardado para a fábrica (só na compra pronta-entrega); w × h: tamanho do arquivo em pixels. */
export type LogoValue = { name: string; thumb: string; size?: number; url?: string; w?: number; h?: number } | null;

/** Largura e altura (px) da imagem enviada; nulo se o navegador não souber (alguns SVG). */
const imageSize = (file: File) =>
  new Promise<{ w: number; h: number } | null>((ok) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    const done = (v: { w: number; h: number } | null) => {
      URL.revokeObjectURL(url);
      ok(v);
    };
    img.onload = () => done(img.naturalWidth && img.naturalHeight ? { w: img.naturalWidth, h: img.naturalHeight } : null);
    img.onerror = () => done(null);
    img.src = url;
  });

/** "PNG · 420 × 280 px" (ou o peso do arquivo, sem as medidas) */
const fileMeta = (v: NonNullable<LogoValue>) => {
  const ext = v.name.match(/\.([a-z0-9]{2,4})$/i)?.[1]?.toUpperCase() ?? (v.thumb.match(/^data:image\/(\w+)/)?.[1]?.toUpperCase() || "Imagem");
  const dims = v.w && v.h ? `${v.w} × ${v.h} px` : v.size ? formatBytes(v.size) : "";
  return [ext, dims].filter(Boolean).join(" · ");
};

/** Guarda o arquivo original no Blob (a fábrica usa para imprimir ou bordar). */
async function uploadOriginal(file: File) {
  const blob = await upload(artPath(file.name, file.type), file, {
    access: "public",
    handleUploadUrl: "/api/artes/upload",
    contentType: artContentType(file),
  });
  return blob.url;
}

export function LogoUpload({
  value,
  onChange,
  label = "logo",
  compact,
  keepOriginal,
  card,
}: {
  value: LogoValue;
  onChange: (v: LogoValue) => void;
  /** nome do campo para leitores de tela, ex.: "Logo da frente" */
  label?: string;
  /** versão menor, usada dentro de cada posição */
  compact?: boolean;
  /** também guarda o arquivo original (compra pronta-entrega: vai para o pedido e para a fila de artes) */
  keepOriginal?: boolean;
  /** simulador: logo enviada num cartão (nome, tipo e medidas) com o botão "Trocar logo" embaixo */
  card?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const hintId = useId();
  // valor mais recente: o envio do original termina depois e não pode grudar numa logo já trocada
  const latest = useRef(value);
  latest.current = value;

  async function handle(file: File | undefined) {
    if (!file) return;
    const err = validateLogo(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const [thumb, dims] = await Promise.all([makeLogoThumb(file), imageSize(file)]);
      const v = { name: file.name.slice(0, 200), thumb, size: file.size, ...(dims ?? {}) };
      latest.current = v;
      onChange(v);
      if (keepOriginal) {
        // em segundo plano: a prévia já aparece; sem o original, a fábrica usa a prévia ou pede o arquivo
        setSending(true);
        uploadOriginal(file)
          .then((url) => {
            if (latest.current?.thumb === thumb) onChange({ ...latest.current, url });
          })
          .catch(() => {})
          .finally(() => setSending(false));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível processar a imagem.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    handle(e.dataTransfer.files?.[0]);
  };

  return (
    <div className={s.upload} data-compact={compact || undefined}>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        aria-label={label}
        onChange={(e) => handle(e.target.files?.[0])}
      />
      {value && card ? (
        <>
          <div className={s.fileCard}>
            <span className={s.filePreview}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value.thumb} alt="Prévia da logo enviada" />
            </span>
            <span className={s.fileInfo}>
              <b title={value.name}>{value.name}</b>
              <small>{fileMeta(value)}</small>
              {keepOriginal && sending && !value.url ? <small>Guardando o arquivo original para a produção…</small> : null}
            </span>
            <button type="button" className="icon-btn" onClick={() => onChange(null)} aria-label={`Remover ${label.toLowerCase()}`}>
              <Trash2 size={18} />
            </button>
          </div>
          <button type="button" className={s.swapBtn} onClick={() => input.current?.click()} disabled={busy}>
            {busy ? <Loader2 size={17} className={s.spin} /> : <Upload size={17} />} Trocar logo
          </button>
        </>
      ) : value ? (
        <div className={s.uploadDone}>
          <span className={s.uploadPreview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value.thumb} alt="Prévia da logo enviada" />
          </span>
          <div className={s.uploadInfo}>
            <b><CheckCircle2 size={15} /> Logo anexada</b>
            <span title={value.name}>{value.name}</span>
            {value.size ? <small>{formatBytes(value.size)} · enviaremos o layout para sua aprovação</small> : null}
            {keepOriginal && sending && !value.url ? <small>Guardando o arquivo original para a produção…</small> : null}
          </div>
          <div className={s.uploadActions}>
            <button type="button" className="icon-btn" onClick={() => input.current?.click()} aria-label={`Trocar ${label.toLowerCase()}`}><RefreshCw size={17} /></button>
            <button type="button" className="icon-btn" onClick={() => onChange(null)} aria-label={`Remover ${label.toLowerCase()}`}><Trash2 size={17} /></button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={s.dropzone}
          data-drag={drag || undefined}
          data-error={error ? true : undefined}
          aria-describedby={hintId}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          disabled={busy}
        >
          <span className={s.dropIcon}>{busy ? <Loader2 size={22} className={s.spin} /> : <ImageUp size={22} strokeWidth={1.75} />}</span>
          <span className={s.dropText}>
            <b>{busy ? "Processando a imagem…" : drag ? "Solte para enviar" : compact ? "Enviar a logo desta posição" : "Arraste sua logo ou clique para enviar"}</b>
            <small id={hintId}>PNG, JPG, WebP ou SVG · até 10 MB. Preferência por fundo transparente.</small>
          </span>
        </button>
      )}
      {error && <p className={s.fieldError} role="alert">{error}</p>}
    </div>
  );
}
