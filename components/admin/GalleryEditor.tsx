"use client";
// Galeria do anúncio no painel: enviar várias fotos de uma vez, escolher a capa, mudar a ordem
// (arrastando ou pelas setas), trocar ou tirar cada foto e ver tudo antes de salvar.
import { useRef, useState, type DragEvent } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, RefreshCw, Star, Trash2, Upload } from "lucide-react";
import { MAX_PHOTOS } from "@/lib/listing";
import { saveGallery } from "@/app/admin/listing-actions";
import { ACCEPT, uploadImage, useAction } from "./MediaAdmin";
import m from "./MediaAdmin.module.css";
import s from "./ListingsAdmin.module.css";

type Item = { src: string; uploading?: boolean; name?: string };

export function GalleryEditor({ slug, saved, enabled }: { slug: string; saved: string[]; enabled: boolean }) {
  const { pending, error, setError, run } = useAction();
  const [items, setItems] = useState<Item[]>(() => saved.map((src) => ({ src })));
  const [over, setOver] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const add = useRef<HTMLInputElement>(null);
  const replace = useRef<HTMLInputElement>(null);
  const replacing = useRef<number | null>(null);

  const list = items.map((i) => i.src);
  const busy = items.some((i) => i.uploading);
  const dirty = JSON.stringify(list) !== JSON.stringify(saved);
  // a versão salva mudou (depois de salvar ou de outra ação do painel): sem mudanças pendentes aqui,
  // a tela passa a mostrar ela; o aviso "Galeria salva" continua à vista
  const savedKey = saved.join("|");
  const [prevKey, setPrevKey] = useState(savedKey);
  if (savedKey !== prevKey) {
    setPrevKey(savedKey);
    if (list.join("|") === prevKey || list.join("|") === savedKey) setItems(saved.map((src) => ({ src })));
  }

  const change = (fn: (cur: Item[]) => Item[]) => {
    setDone(false);
    setItems(fn);
  };

  /** Envia as fotos para o Blob na hora (prévia já aparece); a galeria só muda no site ao salvar. */
  const upload = (files: File[], at?: number) => {
    setError(null);
    const room = MAX_PHOTOS - items.length + (at !== undefined ? 1 : 0);
    if (files.length > room) setError(`No máximo ${MAX_PHOTOS} fotos por anúncio: ${files.length - room} ficaram de fora.`);
    for (const file of files.slice(0, Math.max(0, room))) {
      const temp = URL.createObjectURL(file);
      change((cur) => {
        const next = [...cur];
        if (at !== undefined) next[at] = { src: temp, uploading: true, name: file.name };
        else next.push({ src: temp, uploading: true, name: file.name });
        return next;
      });
      uploadImage(file, "produtos")
        .then((url) => change((cur) => cur.map((i) => (i.src === temp ? { src: url } : i))))
        .catch((e) => {
          setError(`${file.name}: ${e instanceof Error ? e.message : "falha no envio."}`);
          change((cur) => cur.filter((i) => i.src !== temp));
        })
        .finally(() => URL.revokeObjectURL(temp));
    }
  };

  const move = (from: number, to: number) =>
    change((cur) => {
      if (to < 0 || to >= cur.length || from === to) return cur;
      const next = [...cur];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });

  const onDropFiles = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (dragFrom !== null) return;
    const files = [...e.dataTransfer.files].filter((f) => ACCEPT.split(",").includes(f.type));
    if (files.length) upload(files);
  };

  return (
    <div className={s.galleryEditor}>
      {error && <p className={m.error}>{error}</p>}
      <ul className={s.photoGrid} aria-busy={pending}>
        {items.map((it, i) => (
          <li
            key={it.src}
            className={s.photo}
            data-cover={i === 0 || undefined}
            data-dragging={dragFrom === i || undefined}
            draggable={!it.uploading}
            onDragStart={(e) => {
              setDragFrom(i);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => dragFrom !== null && e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragFrom !== null) move(dragFrom, i);
              setDragFrom(null);
            }}
            onDragEnd={() => setDragFrom(null)}
          >
            <span className={s.photoImg}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.src} alt={`Foto ${i + 1}`} draggable={false} />
              {it.uploading && <span className={m.uploading}>Enviando…</span>}
              {i === 0 && (
                <em>
                  <Star size={11} /> Capa
                </em>
              )}
              <b className={s.photoNum}>{i + 1}</b>
            </span>
            <div className={s.photoActions}>
              <button type="button" className="icon-button" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={`Mover foto ${i + 1} para a esquerda`} title="Mover para a esquerda">
                <ArrowLeft size={14} />
              </button>
              <button
                type="button"
                className="icon-button"
                disabled={i === items.length - 1}
                onClick={() => move(i, i + 1)}
                aria-label={`Mover foto ${i + 1} para a direita`}
                title="Mover para a direita"
              >
                <ArrowRight size={14} />
              </button>
              {i > 0 && (
                <button type="button" className="icon-button" onClick={() => move(i, 0)} aria-label={`Usar a foto ${i + 1} como capa`} title="Usar como capa">
                  <Star size={14} />
                </button>
              )}
              <button
                type="button"
                className="icon-button"
                disabled={it.uploading}
                onClick={() => {
                  replacing.current = i;
                  replace.current?.click();
                }}
                aria-label={`Trocar a foto ${i + 1}`}
                title="Trocar esta foto"
              >
                <RefreshCw size={14} />
              </button>
              <button
                type="button"
                className="icon-button"
                disabled={it.uploading}
                onClick={() => change((cur) => cur.filter((_, k) => k !== i))}
                aria-label={`Tirar a foto ${i + 1}`}
                title="Tirar da galeria"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
        {items.length < MAX_PHOTOS && (
          <li>
            <button
              type="button"
              className={s.addPhotos}
              data-over={over || undefined}
              disabled={!enabled}
              onClick={() => add.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragFrom === null) setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={onDropFiles}
            >
              <ImagePlus size={24} />
              <b>Adicionar fotos</b>
              <small>Selecione ou arraste várias de uma vez</small>
            </button>
          </li>
        )}
      </ul>
      <input
        ref={add}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          upload([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
      <input
        ref={replace}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && replacing.current !== null) upload([f], replacing.current);
          e.target.value = "";
        }}
      />
      <p className={s.hint}>
        A primeira foto é a capa (vitrine e topo da página do produto); a segunda aparece ao passar o mouse na vitrine. Use fotos verticais (4:5), de até 8
        MB, em JPG, PNG, WebP ou AVIF. Arraste as fotos para mudar a ordem ou use as setas.
      </p>
      <div className={s.saveBar} data-dirty={dirty || undefined}>
        <span>
          {busy ? "Enviando fotos…" : done && !dirty ? "Galeria salva. A loja já mostra as fotos novas." : dirty ? "Galeria com alterações não salvas" : `${items.length} foto${items.length === 1 ? "" : "s"}`}
        </span>
        <div className="button-row">
          {dirty && (
            <button type="button" className="button secondary small" disabled={pending} onClick={() => change(() => saved.map((src) => ({ src })))}>
              Descartar
            </button>
          )}
          <button
            type="button"
            className="button primary small"
            disabled={!enabled || pending || busy || !dirty || !items.length}
            onClick={() => run(() => saveGallery(slug, list), () => setDone(true))}
          >
            <Upload size={14} /> {pending ? "Salvando…" : "Salvar galeria"}
          </button>
        </div>
      </div>
    </div>
  );
}
