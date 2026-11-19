"use client";
// Painel: partes da loja editadas sem mexer no código.
// - Banners → barra de condições (embaixo do banner da home) e banner da "Minha conta";
// - Categorias → categorias da home em 1 ou 2 linhas.
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import {
  ACCOUNT_BANNER_DEFAULT,
  BENEFIT_ICON_LABELS,
  BENEFIT_ICONS,
  BENEFIT_TEXT_MAX,
  BENEFITS_MAX,
  defaultBenefits,
  type BenefitIcon,
  type Benefits,
  type CategoryRows,
  type SiteContent,
} from "@/lib/site-content";
import { saveAccountBanner, saveBenefits, saveCategoryRows } from "@/app/admin/settings-actions";
import { BenefitIconView, BenefitsBar } from "@/components/home/BenefitsBar";
import { ACCEPT, uploadImage, useAction } from "./MediaAdmin";
import m from "./MediaAdmin.module.css";
import s from "./StorefrontAdmin.module.css";

const noDb = (
  <div className="admin-panel">
    <p className={`${m.note} ${s.pad}`}>Banco de dados não configurado: não é possível salvar alterações.</p>
  </div>
);

/* ---------------- Barra de condições ---------------- */

export function BenefitsAdmin({ content }: { content: SiteContent | null }) {
  const { pending, error, run } = useAction();
  const saved = content?.benefits ?? defaultBenefits;
  const [d, setD] = useState<Benefits>(saved);
  if (!content) return noDb;

  const dirty = JSON.stringify(d) !== JSON.stringify(saved);
  const setItem = (i: number, patch: Partial<Benefits["items"][number]>) =>
    setD((x) => ({ ...x, items: x.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }));
  const move = (i: number, dir: number) =>
    setD((x) => {
      const items = [...x.items];
      [items[i], items[i + dir]] = [items[i + dir], items[i]];
      return { ...x, items };
    });

  return (
    <div className="admin-panel">
      <div className="panel-heading">
        <div>
          <h3>Barra de condições</h3>
          <p>
            Faixa azul logo abaixo do banner da home, com as condições da loja (desconto, compra segura, parcelamento, frete). Até {BENEFITS_MAX} itens,
            cada um com um ícone e um texto curto. No celular, os itens ficam em duas colunas.
          </p>
        </div>
      </div>
      <form
        className={s.body}
        onSubmit={(e) => {
          e.preventDefault();
          run(() => saveBenefits(d));
        }}
      >
        <label className={m.check}>
          <input type="checkbox" checked={d.active} onChange={(e) => setD((x) => ({ ...x, active: e.target.checked }))} /> Mostrar na home
        </label>

        <ol className={s.items} aria-busy={pending}>
          {d.items.map((it, i) => (
            <li key={i} className={s.item}>
              <span className={s.iconPreview}>
                <BenefitIconView icon={it.icon} size={22} />
              </span>
              <label className={m.field}>
                <span className="sr-only">Ícone do item {i + 1}</span>
                <select value={it.icon} onChange={(e) => setItem(i, { icon: e.target.value as BenefitIcon })}>
                  {BENEFIT_ICONS.map((ic) => (
                    <option key={ic} value={ic}>
                      {BENEFIT_ICON_LABELS[ic]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`${m.field} ${s.text}`}>
                <span className="sr-only">Texto do item {i + 1}</span>
                <input value={it.text} onChange={(e) => setItem(i, { text: e.target.value })} maxLength={BENEFIT_TEXT_MAX} placeholder="Ex.: Compra 100% segura" />
              </label>
              <div className={s.itemActions}>
                <button type="button" className="icon-button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir (mais à esquerda)">
                  <ArrowUp size={16} />
                </button>
                <button type="button" className="icon-button" disabled={i === d.items.length - 1} onClick={() => move(i, 1)} aria-label="Descer (mais à direita)">
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setD((x) => ({ ...x, items: x.items.filter((_, j) => j !== i) }))}
                  aria-label={`Remover o item ${i + 1}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ol>
        <div className={s.row}>
          <button
            type="button"
            className="button secondary small"
            disabled={d.items.length >= BENEFITS_MAX}
            onClick={() => setD((x) => ({ ...x, items: [...x.items, { icon: "star", text: "" }] }))}
          >
            <Plus size={15} /> Adicionar item
          </button>
          <button type="button" className={m.linkBtn} onClick={() => setD(defaultBenefits)}>
            Voltar para os textos padrão
          </button>
        </div>

        <div className={s.preview}>
          <span className={s.previewLabel}>Prévia</span>
          {d.active && d.items.length ? <BenefitsBar benefits={d} /> : <p className={m.note}>A barra não aparece na home.</p>}
        </div>

        {error && <p className={m.error}>{error}</p>}
        <div className={m.formActions}>
          {dirty && (
            <button type="button" className="button secondary" onClick={() => setD(saved)}>
              Desfazer
            </button>
          )}
          <button type="submit" className="button primary" disabled={pending || !dirty}>
            {pending ? "Salvando…" : dirty ? "Salvar barra" : "Salvo"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- Banner da "Minha conta" ---------------- */

export function AccountBannerAdmin({ content }: { content: SiteContent | null }) {
  const { pending, error, setError, run } = useAction();
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  if (!content) return noDb;
  const image = content.accountBanner || ACCOUNT_BANNER_DEFAULT;

  const onFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file, "banners");
      run(() => saveAccountBanner(url));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no envio da imagem.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="panel-heading">
        <div>
          <h3>Banner da Minha conta</h3>
          <p>
            Foto do topo da página Minha conta, atrás de &quot;Olá, nome&quot;. Use uma foto horizontal (2400 × 500 px). O lado esquerdo fica escurecido para
            o texto aparecer bem.
          </p>
        </div>
      </div>
      <div className={s.body}>
        <button type="button" className={s.account} onClick={() => input.current?.click()} disabled={uploading || pending} aria-label="Trocar a foto do banner da Minha conta">
          <span className={s.accountImg} style={{ backgroundImage: `url(${JSON.stringify(image)})` }} aria-hidden />
          <span className={s.accountText} aria-hidden>
            <small>MINHA CONTA</small>
            <b>Olá, Cliente</b>
          </span>
          <span className={m.change}>
            {content.accountBanner ? <Upload size={14} /> : <ImagePlus size={14} />} Trocar foto
          </span>
          {(uploading || pending) && <span className={m.uploading}>{uploading ? "Enviando…" : "Salvando…"}</span>}
        </button>
        <input ref={input} type="file" accept={ACCEPT} hidden onChange={(e) => (onFile(e.target.files?.[0]), (e.target.value = ""))} />
        {content.accountBanner && (
          <button type="button" className={m.linkBtn} disabled={pending} onClick={() => run(() => saveAccountBanner(""))}>
            <RotateCcw size={12} /> Voltar para a foto padrão
          </button>
        )}
        {error && <p className={m.error}>{error}</p>}
      </div>
    </div>
  );
}

/* ---------------- Categorias na home: 1 ou 2 linhas ---------------- */

export function CategoryRowsAdmin({ content }: { content: SiteContent | null }) {
  const { pending, error, run } = useAction();
  if (!content) return null;
  const options: [CategoryRows, string, string][] = [
    [1, "1 linha", "Uma fileira de quadros que rola para o lado, com as setas."],
    [2, "2 linhas", "Duas fileiras: no computador aparecem todas de uma vez."],
  ];
  return (
    <div className="admin-panel">
      <div className="panel-heading">
        <div>
          <h3>Categorias na home</h3>
          <p>Como os quadros das categorias aparecem na página inicial. Vale na hora, ao clicar.</p>
        </div>
      </div>
      <div className={s.body}>
        <div className={s.rows} role="radiogroup" aria-label="Linhas de categorias na home" aria-busy={pending}>
          {options.map(([rows, label, hint]) => (
            <button
              key={rows}
              type="button"
              role="radio"
              aria-checked={content.categoryRows === rows}
              className={s.rowOption}
              disabled={pending}
              onClick={() => content.categoryRows !== rows && run(() => saveCategoryRows(rows))}
            >
              <span className={s.rowSketch} data-rows={rows} aria-hidden>
                {Array.from({ length: rows * 5 }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
              <b>{label}</b>
              <small>{hint}</small>
            </button>
          ))}
        </div>
        {error && <p className={m.error}>{error}</p>}
      </div>
    </div>
  );
}
