"use client";
// Painel: banners da home e fotos de vitrine dos produtos. Imagens vão direto
// do navegador para o Vercel Blob; os dados são gravados pelas server actions.
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Pencil, Plus, RotateCcw, Trash2, Upload, X } from "lucide-react";
import type { Banner, PhotoOverrides } from "@/lib/banners";
import { products } from "@/lib/catalog";
import {
  deleteBanner,
  reorderBanners,
  resetProductPhoto,
  saveBanner,
  setProductPhoto,
  type MediaResult,
} from "@/app/admin/media-actions";
import s from "./MediaAdmin.module.css";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_MB = 8;

async function uploadImage(file: File, folder: "banners" | "produtos") {
  if (!ACCEPT.split(",").includes(file.type)) throw new Error("Use JPG, PNG, WebP ou AVIF.");
  if (file.size > MAX_MB * 1024 * 1024) throw new Error(`Imagem acima de ${MAX_MB} MB.`);
  const name = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-60);
  const blob = await upload(`${folder}/${name}`, file, { access: "public", handleUploadUrl: "/api/admin/upload" });
  return blob.url;
}

const LINKS = [
  ["/loja?tipo=stock", "Pronta-entrega"],
  ["/orcamento", "Monte seu pedido"],
  ["/loja", "Todos os produtos"],
  ...[
    ["polos", "Polos"],
    ["camisetas", "Camisetas"],
    ["calcas", "Calças"],
    ["jalecos", "Jalecos"],
    ["moletons", "Moletons"],
    ["operacional", "Operacional"],
    ["alimenticia", "Área alimentícia"],
    ["alta-visibilidade", "Alta visibilidade"],
  ].map(([slug, name]) => [`/loja?categoria=${slug}`, `Categoria: ${name}`]),
  ["/contato", "Contato"],
] as const;

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<MediaResult>, after?: () => void) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) return setError(r.error);
      after?.();
      router.refresh();
    });
  return { pending, error, setError, run };
}

/* ---------------- Banners ---------------- */

type Draft = Omit<Banner, "id"> & { id?: string };
const emptyDraft: Draft = { title: "", subtitle: "", ctaLabel: "", ctaHref: "/loja?tipo=stock", image: "", active: true };

export function BannersAdmin({ banners }: { banners: Banner[] | null }) {
  const { pending, error, setError, run } = useAction();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (!banners)
    return (
      <div className="admin-panel">
        <p className={s.note}>Banco de dados não configurado: a home usa os banners padrão.</p>
      </div>
    );

  const move = (i: number, d: number) => {
    const ids = banners.map((b) => b.id);
    [ids[i], ids[i + d]] = [ids[i + d], ids[i]];
    run(() => reorderBanners(ids));
  };
  const activeCount = banners.filter((b) => b.active).length;

  return (
    <div className="admin-panel">
      <div className="panel-heading">
        <div>
          <h3>Banners da home</h3>
          <p>
            Os banners ativos passam sozinhos no topo da página inicial, na ordem abaixo. Use fotos de pessoas vestindo os uniformes,
            na vertical ou quadradas (mínimo 1000 px). O fundo esfumaçado é gerado da própria foto.
          </p>
        </div>
        <button type="button" className="button primary small" onClick={() => (setError(null), setDraft({ ...emptyDraft }))}>
          <Plus size={15} /> Novo banner
        </button>
      </div>

      {error && <p className={s.error}>{error}</p>}
      {activeCount === 0 && <p className={s.note}>Nenhum banner ativo: a home mostra os banners padrão.</p>}

      <ol className={s.banners} aria-busy={pending}>
        {banners.map((b, i) => (
          <li key={b.id} className={s.banner} data-off={!b.active || undefined}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image} alt="" className={s.bannerImg} />
            <div className={s.bannerBody}>
              <span className={s.order}>
                {i + 1}
                {!b.active && " · oculto"}
              </span>
              <strong>{b.title}</strong>
              {b.subtitle && <small>{b.subtitle}</small>}
              {b.ctaLabel && (
                <small className={s.cta}>
                  Botão: {b.ctaLabel} → {b.ctaHref}
                </small>
              )}
            </div>
            <div className={s.bannerActions}>
              <button type="button" className="icon-button" disabled={pending || i === 0} onClick={() => move(i, -1)} aria-label="Subir">
                <ArrowUp size={16} />
              </button>
              <button type="button" className="icon-button" disabled={pending || i === banners.length - 1} onClick={() => move(i, 1)} aria-label="Descer">
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                className="icon-button"
                disabled={pending}
                onClick={() => run(() => saveBanner({ ...b, active: !b.active }))}
                aria-label={b.active ? "Ocultar" : "Mostrar"}
                title={b.active ? "Ocultar da home" : "Mostrar na home"}
              >
                {b.active ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button type="button" className="icon-button" disabled={pending} onClick={() => (setError(null), setDraft({ ...b }))} aria-label="Editar">
                <Pencil size={16} />
              </button>
              {confirmDelete === b.id ? (
                <button
                  type="button"
                  className={`button small ${s.danger}`}
                  disabled={pending}
                  onClick={() => run(() => deleteBanner(b.id), () => setConfirmDelete(null))}
                  onBlur={() => setConfirmDelete(null)}
                  autoFocus
                >
                  Confirmar exclusão
                </button>
              ) : (
                <button type="button" className="icon-button" disabled={pending} onClick={() => setConfirmDelete(b.id)} aria-label="Excluir">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>

      {draft && <BannerEditor draft={draft} onClose={() => setDraft(null)} />}
    </div>
  );
}

function BannerEditor({ draft: initial, onClose }: { draft: Draft; onClose: () => void }) {
  const { pending, error, setError, run } = useAction();
  const [d, setD] = useState<Draft>(initial);
  const [uploading, setUploading] = useState(false);
  const custom = !LINKS.some(([href]) => href === d.ctaHref);
  const [customLink, setCustomLink] = useState(custom && !!d.ctaHref);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  const onFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      set("image", await uploadImage(file, "banners"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no envio da imagem.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="order-drawer-overlay" onClick={onClose}>
      <aside className={`order-drawer ${s.editor}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Editar banner">
        <div className="row-between">
          <span className="eyebrow">{d.id ? "EDITAR BANNER" : "NOVO BANNER"}</span>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar">
            <X />
          </button>
        </div>

        <form
          className={s.form}
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveBanner(d), onClose);
          }}
        >
          <label className={s.drop} data-has={!!d.image || undefined}>
            {d.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.image} alt="Prévia do banner" />
            ) : (
              <span>
                <ImagePlus size={28} />
                Enviar foto
              </span>
            )}
            {uploading && <span className={s.uploading}>Enviando…</span>}
            <input type="file" accept={ACCEPT} onChange={(e) => onFile(e.target.files?.[0])} disabled={uploading} />
            {d.image && (
              <span className={s.change}>
                <Upload size={14} /> Trocar foto
              </span>
            )}
          </label>

          <label className={s.field}>
            Título
            <input value={d.title} onChange={(e) => set("title", e.target.value)} maxLength={90} required />
          </label>
          <label className={s.field}>
            Texto de apoio
            <textarea value={d.subtitle} onChange={(e) => set("subtitle", e.target.value)} maxLength={180} rows={3} />
          </label>
          <div className={s.row}>
            <label className={s.field}>
              Texto do botão
              <input value={d.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} maxLength={32} placeholder="Ex.: Ver polos" />
            </label>
            <label className={s.field}>
              Link do botão
              <select
                value={customLink ? "__custom" : d.ctaHref}
                onChange={(e) => {
                  const v = e.target.value;
                  setCustomLink(v === "__custom");
                  if (v !== "__custom") set("ctaHref", v);
                }}
              >
                {LINKS.map(([href, label]) => (
                  <option key={href} value={href}>
                    {label}
                  </option>
                ))}
                <option value="__custom">Outro link…</option>
              </select>
            </label>
          </div>
          {customLink && (
            <label className={s.field}>
              Endereço do link
              <input value={d.ctaHref} onChange={(e) => set("ctaHref", e.target.value)} placeholder="/produto/polo-pv-basica ou https://…" />
            </label>
          )}
          <label className={s.check}>
            <input type="checkbox" checked={d.active} onChange={(e) => set("active", e.target.checked)} /> Mostrar na home
          </label>

          {error && <p className={s.error}>{error}</p>}
          <div className={s.formActions}>
            <button type="button" className="button secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="button primary" disabled={pending || uploading || !d.image}>
              {pending ? "Salvando…" : "Salvar banner"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

/* ---------------- Fotos dos produtos ---------------- */

export function ProductPhotosAdmin({ photos, enabled }: { photos: PhotoOverrides; enabled: boolean }) {
  const { pending, error, setError, run } = useAction();
  const [busy, setBusy] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const onFile = async (slug: string, slot: number, file?: File) => {
    if (!file) return;
    const key = `${slug}-${slot}`;
    setBusy(key);
    setError(null);
    try {
      const url = await uploadImage(file, "produtos");
      run(() => setProductPhoto(slug, slot, url));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no envio da imagem.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="admin-panel">
      <div className="panel-heading">
        <div>
          <h3>Fotos dos produtos</h3>
          <p>
            Foto 1 aparece na vitrine e abre a página do produto; a foto 2 aparece ao passar o mouse e na galeria. Use fotos verticais
            (4:5) de pessoas vestindo a peça. A prévia da logo continua usando a foto da peça sozinha.
          </p>
        </div>
      </div>
      {!enabled && <p className={s.note}>Banco de dados não configurado: não é possível trocar as fotos.</p>}
      {error && <p className={s.error}>{error}</p>}

      <ul className={s.products} aria-busy={pending}>
        {products.map((p) => {
          const o = photos[p.slug] ?? [];
          return (
            <li key={p.slug} className={s.product}>
              <div className={s.productHead}>
                <strong>{p.name}</strong>
                <a href={`/produto/${p.slug}`} target="_blank" rel="noreferrer">
                  Ver na loja
                </a>
              </div>
              <div className={s.slots}>
                {p.photos.map((def, slot) => {
                  const key = `${p.slug}-${slot}`;
                  const custom = o[slot];
                  return (
                    <div key={slot} className={s.slot}>
                      <span className={s.slotImg}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={custom ?? def} alt="" loading="lazy" />
                        {busy === key && <span className={s.uploading}>Enviando…</span>}
                        <em>{custom ? "Personalizada" : "Padrão"}</em>
                      </span>
                      <small>Foto {slot + 1}</small>
                      <div className={s.slotActions}>
                        <button
                          type="button"
                          className="button secondary small"
                          disabled={!enabled || pending || !!busy}
                          onClick={() => inputs.current[key]?.click()}
                        >
                          <Upload size={14} /> Trocar
                        </button>
                        {custom && (
                          <button
                            type="button"
                            className="icon-button"
                            disabled={pending || !!busy}
                            onClick={() => run(() => resetProductPhoto(p.slug, slot))}
                            aria-label="Voltar para a foto padrão"
                            title="Voltar para a foto padrão"
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                      </div>
                      <input
                        ref={(el) => {
                          inputs.current[key] = el;
                        }}
                        type="file"
                        accept={ACCEPT}
                        hidden
                        onChange={(e) => {
                          onFile(p.slug, slot, e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
