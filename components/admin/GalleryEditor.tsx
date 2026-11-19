"use client";
// Galeria do anúncio no painel, separada por cor: escolhe a cor em cima e envia as fotos dela
// (até MAX_PHOTOS por cor; elas já entram marcadas com a cor). "Todas as cores" guarda as fotos que
// valem para qualquer cor (tabela de medidas, detalhes). Em cada cor dá para mudar a ordem
// (arrastando ou pelas setas), trocar, tirar, passar para outra cor e escolher a capa da vitrine.
// Na página do produto, escolher a cor mostra só as fotos dela e as de todas as cores.
import { useRef, useState, type DragEvent } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, RefreshCw, Star, Trash2, Upload } from "lucide-react";
import { getColor } from "@/lib/catalog";
import { MAX_PHOTOS } from "@/lib/listing";
import { saveGallery } from "@/app/admin/listing-actions";
import { ACCEPT, uploadImage, useAction } from "./MediaAdmin";
import m from "./MediaAdmin.module.css";
import s from "./ListingsAdmin.module.css";

type Item = { src: string; uploading?: boolean; name?: string; /** cor da peça nesta foto (id); sem cor = todas as cores */ color?: string };

/** "" = todas as cores (fotos sem cor marcada) */
const ALL = "";
const colorName = (id: string) => (id === ALL ? "Todas as cores" : (getColor(id)?.name ?? id));

export function GalleryEditor({
  slug,
  saved,
  savedColors = {},
  colors = [],
  enabled,
}: {
  slug: string;
  saved: string[];
  /** cor marcada em cada foto salva (endereço → id da cor) */
  savedColors?: Record<string, string>;
  /** cores à venda do anúncio */
  colors?: string[];
  enabled: boolean;
}) {
  const { pending, error, setError, run } = useAction();
  const fromSaved = () => saved.map((src) => ({ src, color: savedColors[src] }));
  const [items, setItems] = useState<Item[]>(fromSaved);
  // começa na cor da capa (ou na primeira cor do anúncio)
  const [group, setGroup] = useState<string>(() => savedColors[saved[0]] ?? (saved.length || colors.length < 2 ? ALL : colors[0]));
  const [over, setOver] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const add = useRef<HTMLInputElement>(null);
  const replace = useRef<HTMLInputElement>(null);
  const replacing = useRef<number | null>(null);

  const list = items.map((i) => i.src);
  const tags = Object.fromEntries(items.flatMap((i) => (i.color ? [[i.src, i.color]] : [])));
  const busy = items.some((i) => i.uploading);
  const keyOf = (l: string[], t: Record<string, string>) => l.map((src) => `${src}=${t[src] ?? ""}`).join("|");
  const dirty = keyOf(list, tags) !== keyOf(saved, savedColors);
  // a versão salva mudou (depois de salvar ou de outra ação do painel): sem mudanças pendentes aqui,
  // a tela passa a mostrar ela; o aviso "Galeria salva" continua à vista
  const savedKey = keyOf(saved, savedColors);
  const [prevKey, setPrevKey] = useState(savedKey);
  if (savedKey !== prevKey) {
    setPrevKey(savedKey);
    const now = keyOf(list, tags);
    if (now === prevKey || now === savedKey) setItems(fromSaved());
  }

  // separa por cor só quando o anúncio tem mais de uma cor (ou já tem foto marcada)
  const byColor = colors.length > 1 || items.some((i) => i.color);
  const orphan = [...new Set(items.flatMap((i) => (i.color && !colors.includes(i.color) ? [i.color] : [])))];
  const groups = byColor ? [...colors, ...orphan, ALL] : [ALL];
  const current = byColor ? group : ALL;
  const inGroup = (it: Item, g: string) => (it.color ?? ALL) === g;
  const count = (g: string) => items.filter((it) => inGroup(it, g)).length;
  // fotos da cor na tela, com a posição de cada uma na galeria inteira
  const shown = items.flatMap((it, gi) => (!byColor || inGroup(it, current) ? [{ it, gi }] : []));

  const change = (fn: (cur: Item[]) => Item[]) => {
    setDone(false);
    setItems(fn);
  };

  /** Envia as fotos para o Blob na hora (prévia já aparece); a galeria só muda no site ao salvar. */
  const upload = (files: File[], at?: number) => {
    setError(null);
    const room = MAX_PHOTOS - shown.length + (at !== undefined ? 1 : 0);
    if (files.length > room)
      setError(`No máximo ${MAX_PHOTOS} fotos ${byColor ? `em ${colorName(current)}` : "por anúncio"}: ${files.length - room} ficaram de fora.`);
    const color = current || undefined;
    for (const file of files.slice(0, Math.max(0, room))) {
      const temp = URL.createObjectURL(file);
      change((cur) => {
        const next = [...cur];
        if (at !== undefined) next[at] = { src: temp, uploading: true, name: file.name, color: cur[at]?.color };
        else next.push({ src: temp, uploading: true, name: file.name, color });
        return next;
      });
      uploadImage(file, "produtos")
        .then((url) => change((cur) => cur.map((i) => (i.src === temp ? { src: url, color: i.color } : i))))
        .catch((e) => {
          setError(`${file.name}: ${e instanceof Error ? e.message : "falha no envio."}`);
          change((cur) => cur.filter((i) => i.src !== temp));
        })
        .finally(() => URL.revokeObjectURL(temp));
    }
  };

  /** Leva a foto da posição `from` para a posição `to` (posições da galeria inteira). */
  const move = (from: number, to: number) =>
    change((cur) => {
      if (to < 0 || to >= cur.length || from === to) return cur;
      const next = [...cur];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
  /** Troca de lugar com a vizinha da mesma cor. */
  const swap = (k: number, d: number) => {
    const a = shown[k]?.gi;
    const b = shown[k + d]?.gi;
    if (a === undefined || b === undefined) return;
    change((cur) => {
      const next = [...cur];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  };

  const onDropFiles = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (dragFrom !== null) return;
    const files = [...e.dataTransfer.files].filter((f) => ACCEPT.split(",").includes(f.type));
    if (files.length) upload(files);
  };

  return (
    <div className={s.galleryEditor}>
      {byColor && (
        <div className={s.galleryTabs} role="tablist" aria-label="Fotos de qual cor">
          {groups.map((g) => {
            const hex = g ? getColor(g)?.hex : undefined;
            const n = count(g);
            return (
              <button
                key={g || "all"}
                type="button"
                role="tab"
                aria-selected={current === g}
                className={s.galleryTab}
                onClick={() => {
                  setGroup(g);
                  setError(null);
                }}
              >
                {g ? <span className={s.galleryDot} style={{ background: hex }} aria-hidden /> : <ImagePlus size={14} aria-hidden />}
                {colorName(g)}
                <small data-full={n >= MAX_PHOTOS || undefined}>
                  {n}/{MAX_PHOTOS}
                </small>
              </button>
            );
          })}
        </div>
      )}
      {byColor && (
        <p className={s.hint}>
          {current
            ? `Fotos da cor ${colorName(current)}: aparecem quando o cliente escolhe ${colorName(current)} na página do produto.`
            : "Fotos que aparecem em qualquer cor escolhida (ex.: tabela de medidas, detalhe do tecido)."}
        </p>
      )}
      {error && <p className={m.error}>{error}</p>}
      <ul className={s.photoGrid} aria-busy={pending}>
        {shown.map(({ it, gi }, k) => (
          <li
            key={it.src}
            className={s.photo}
            data-cover={gi === 0 || undefined}
            data-dragging={dragFrom === gi || undefined}
            draggable={!it.uploading}
            onDragStart={(e) => {
              setDragFrom(gi);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => dragFrom !== null && e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragFrom !== null) move(dragFrom, gi);
              setDragFrom(null);
            }}
            onDragEnd={() => setDragFrom(null)}
          >
            <span className={s.photoImg}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.src} alt={`Foto ${k + 1}`} draggable={false} />
              {it.uploading && <span className={m.uploading}>Enviando…</span>}
              {gi === 0 && (
                <em>
                  <Star size={11} /> Capa
                </em>
              )}
              <b className={s.photoNum}>{k + 1}</b>
            </span>
            <div className={s.photoActions}>
              <button type="button" className="icon-button" disabled={k === 0} onClick={() => swap(k, -1)} aria-label={`Mover foto ${k + 1} para a esquerda`} title="Mover para a esquerda">
                <ArrowLeft size={14} />
              </button>
              <button
                type="button"
                className="icon-button"
                disabled={k === shown.length - 1}
                onClick={() => swap(k, 1)}
                aria-label={`Mover foto ${k + 1} para a direita`}
                title="Mover para a direita"
              >
                <ArrowRight size={14} />
              </button>
              {gi > 0 && (
                <button type="button" className="icon-button" onClick={() => move(gi, 0)} aria-label={`Usar a foto ${k + 1} como capa`} title="Usar como capa da vitrine">
                  <Star size={14} />
                </button>
              )}
              <button
                type="button"
                className="icon-button"
                disabled={it.uploading}
                onClick={() => {
                  replacing.current = gi;
                  replace.current?.click();
                }}
                aria-label={`Trocar a foto ${k + 1}`}
                title="Trocar esta foto"
              >
                <RefreshCw size={14} />
              </button>
              <button
                type="button"
                className="icon-button"
                disabled={it.uploading}
                onClick={() => change((cur) => cur.filter((x) => x.src !== it.src))}
                aria-label={`Tirar a foto ${k + 1}`}
                title="Tirar da galeria"
              >
                <Trash2 size={14} />
              </button>
            </div>
            {byColor && (
              <label className={s.photoColor}>
                <span>Passar para</span>
                <select
                  value={it.color ?? ALL}
                  onChange={(e) => {
                    const color = e.target.value || undefined;
                    if (count(e.target.value) >= MAX_PHOTOS) return setError(`${colorName(e.target.value)} já tem ${MAX_PHOTOS} fotos.`);
                    change((cur) => cur.map((x) => (x.src === it.src ? { ...x, color } : x)));
                  }}
                  aria-label={`Cor da foto ${k + 1}`}
                >
                  {groups.map((g) => (
                    <option key={g || "all"} value={g}>
                      {colorName(g)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </li>
        ))}
        {shown.length < MAX_PHOTOS && (
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
              <b>{byColor ? `Adicionar fotos: ${colorName(current)}` : "Adicionar fotos"}</b>
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
        {byColor
          ? `Escolha a cor em cima e envie as fotos dela (até ${MAX_PHOTOS} por cor). A capa (estrela) é a foto da vitrine, e a página do produto abre na cor dela. `
          : "A primeira foto é a capa (vitrine e topo da página do produto); a segunda aparece ao passar o mouse na vitrine. "}
        Use fotos verticais (4:5), de até 8 MB, em JPG, PNG, WebP ou AVIF. Arraste as fotos para mudar a ordem ou use as setas.
      </p>
      <div className={s.saveBar} data-dirty={dirty || undefined}>
        <span>
          {busy ? "Enviando fotos…" : done && !dirty ? "Galeria salva. A loja já mostra as fotos novas." : dirty ? "Galeria com alterações não salvas" : `${items.length} foto${items.length === 1 ? "" : "s"} no anúncio`}
        </span>
        <div className="button-row">
          {dirty && (
            <button type="button" className="button secondary small" disabled={pending} onClick={() => change(() => fromSaved())}>
              Descartar
            </button>
          )}
          <button
            type="button"
            className="button primary small"
            disabled={!enabled || pending || busy || !dirty || !items.length}
            onClick={() => run(() => saveGallery(slug, list, tags), () => setDone(true))}
          >
            <Upload size={14} /> {pending ? "Salvando…" : "Salvar galeria"}
          </button>
        </div>
      </div>
    </div>
  );
}
