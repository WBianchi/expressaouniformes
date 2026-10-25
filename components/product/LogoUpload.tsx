"use client";
import { CheckCircle2, ImageUp, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";
import { formatBytes, makeLogoThumb, validateLogo } from "./logoThumb";
import s from "./Product.module.css";

export type LogoValue = { name: string; thumb: string; size?: number } | null;

export function LogoUpload({
  value,
  onChange,
  label = "logo",
  compact,
}: {
  value: LogoValue;
  onChange: (v: LogoValue) => void;
  /** nome do campo para leitores de tela, ex.: "Logo da frente" */
  label?: string;
  /** versão menor, usada dentro de cada posição */
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hintId = useId();

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
      const thumb = await makeLogoThumb(file);
      onChange({ name: file.name.slice(0, 200), thumb, size: file.size });
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
      {value ? (
        <div className={s.uploadDone}>
          <span className={s.uploadPreview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value.thumb} alt="Prévia da logo enviada" />
          </span>
          <div className={s.uploadInfo}>
            <b><CheckCircle2 size={15} /> Logo anexada</b>
            <span title={value.name}>{value.name}</span>
            {value.size ? <small>{formatBytes(value.size)} · enviaremos o layout para sua aprovação</small> : null}
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
