"use client";
// Painel → Anúncios: lista de anúncios, "Novo anúncio" e "Editar anúncio" (título, categoria,
// descrição, ficha técnica, preço, cores, tamanhos, galeria e fotos). O texto é salvo no botão
// "Salvar anúncio"; a galeria no "Salvar galeria"; as fotos da peça e por cor, a cada envio.
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Eye, EyeOff, ExternalLink, ImagePlus, Pencil, Plus, RotateCcw, Search, Trash2, Upload, X } from "lucide-react";
import {
  categories,
  catalogHas,
  colors as palette,
  getCategory,
  getColor,
  money,
  NO_PHOTO,
  products,
  withListing,
  type CatalogEdits,
  type Color,
  type Product,
  type SaleKind,
} from "@/lib/catalog";
import type { PhotoOverrides } from "@/lib/banners";
import { withPhotos } from "@/lib/product-media";
import { listingFormOf, sameData, SIZE_OPTIONS, TECHNIQUE_OPTIONS, type ListingForm } from "@/lib/listing";

import { defaultSpecs, EDITABLE_SPECS, type SpecKey } from "@/lib/specs";
import { createProduct, deleteProduct, resetListing, saveListing, setColorPhoto, setPublished } from "@/app/admin/listing-actions";
import { ACCEPT, ProductPhotoSlots, uploadImage, useAction } from "./MediaAdmin";
import { GalleryEditor } from "./GalleryEditor";
import m from "./MediaAdmin.module.css";
import s from "./ListingsAdmin.module.css";

const NO_PHOTOS: (string | null)[] = [null, null, null, null, null];
type Filter = "todos" | "stock" | "custom" | "editados" | "rascunhos";

/** "24,90" → 24.9; vazio → null; inválido → NaN */
const parseMoney = (v: string) => {
  const t = v
    .replace(/[^\d,.]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  return t ? Number(t) : null;
};
const moneyText = (n: number | null) => (n === null ? "" : n.toFixed(2).replace(".", ","));

function Swatch({ c }: { c: Color }) {
  return <span className={s.swatch} data-mescla={c.pattern === "mescla" || undefined} style={{ background: c.hex }} aria-hidden />;
}

export function ListingsAdmin({ edits, photos, enabled }: { edits: CatalogEdits; photos: PhotoOverrides; enabled: boolean }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");

  // anúncios da loja + rascunhos cadastrados no painel (ainda fora da loja)
  const drafts = Object.entries(edits.created)
    .filter(([, c]) => !c.published)
    .flatMap(([slug]) => {
      const p = withListing(slug, edits.listings[slug]);
      return p ? [p] : [];
    });
  const all: Product[] = [...products, ...drafts];

  if (editing)
    return catalogHas(editing) ? (
      <ListingEditor
        key={editing}
        slug={editing}
        edits={edits}
        photos={photos[editing] ?? NO_PHOTOS}
        enabled={enabled}
        onBack={() => setEditing(null)}
      />
    ) : (
      <div className="admin-panel">
        <p className="empty-state">Abrindo o anúncio…</p>
      </div>
    );

  const isEdited = (slug: string) => Object.keys(edits.listings[slug] ?? {}).length > 0 || !!photos[slug]?.some(Boolean);
  const q = query.trim().toLowerCase();
  const list = all.filter(
    (p) =>
      (!q || `${p.name} ${p.subtitle} ${getCategory(p.category)?.name}`.toLowerCase().includes(q)) &&
      (filter === "todos" ||
        (filter === "editados" ? isEdited(p.slug) : filter === "rascunhos" ? drafts.includes(p) : p.kind === filter)),
  );

  return (
    <div className="admin-panel">
      <div className="panel-heading">
        <div>
          <h3>Anúncios</h3>
          <p>Clique num produto para editar o anúncio: título, categoria, descrição, ficha técnica, preço, cores, tamanhos e fotos.</p>
        </div>
        <button type="button" className="button primary small" disabled={!enabled} onClick={() => setCreating(true)}>
          <Plus size={15} /> Novo anúncio
        </button>
      </div>
      <div className={s.body}>
        {!enabled && <p className={m.note}>Banco de dados não configurado: dá para ver os anúncios, mas não salvar alterações.</p>}
        {creating && (
          <NewListing
            onCancel={() => setCreating(false)}
            onCreated={(slug) => {
              setCreating(false);
              setEditing(slug);
            }}
          />
        )}
        <div className={s.toolbar}>
          <label className={s.search}>
            <Search size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar produto" aria-label="Buscar produto" />
          </label>
          <div className={s.tabs} role="tablist" aria-label="Filtrar anúncios">
            {(
              [
                ["todos", "Todos"],
                ["stock", "Pronta-entrega"],
                ["custom", "Fabricação"],
                ["editados", "Editados"],
                ...(drafts.length ? ([["rascunhos", `Rascunhos (${drafts.length})`]] as const) : []),
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <ul className={s.grid}>
          {list.map((p) => {
            const draft = drafts.includes(p);
            const cover = withPhotos(p, photos[p.slug]).photos[0];
            return (
              <li key={p.slug}>
                <button type="button" className={s.card} onClick={() => setEditing(p.slug)}>
                  <span className={s.cardImg}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover} alt="" loading="lazy" />
                    {draft ? <em data-tone="draft">Rascunho</em> : isEdited(p.slug) && <em>Editado</em>}
                  </span>
                  <span className={s.cardBody}>
                    <small>
                      {p.kind === "stock" ? "Pronta-entrega" : "Fabricação"} · {getCategory(p.category)?.name}
                    </small>
                    <strong>{p.name}</strong>
                    <span>{p.kind === "stock" ? `${money(p.price)} / peça` : "Sob orçamento"}</span>
                  </span>
                  <span className={s.cardEdit}>
                    <Pencil size={14} /> Editar anúncio
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {!list.length && <p className="empty-state">Nenhum produto encontrado.</p>}
      </div>
    </div>
  );
}

/* ---------------- Novo anúncio ---------------- */

function NewListing({ onCancel, onCreated }: { onCancel: () => void; onCreated: (slug: string) => void }) {
  const { pending, error, setError, run } = useAction();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]?.slug ?? "");
  const [kind, setKind] = useState<SaleKind>("custom");
  return (
    <form
      className={s.newForm}
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim().length < 3) return setError("Informe o título do anúncio.");
        let slug = "";
        run(
          async () => {
            const r = await createProduct({ name, kind, category });
            if (r.ok && r.slug) slug = r.slug;
            return r;
          },
          () => onCreated(slug),
        );
      }}
    >
      <div className={s.newHead}>
        <h4>Novo anúncio</h4>
        <button type="button" className="icon-button" onClick={onCancel} aria-label="Fechar">
          <X size={16} />
        </button>
      </div>
      <div className={s.newFields}>
        <label className={m.field}>
          Título do anúncio
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={90} placeholder="Ex.: Camisa Polo Dry Fit" autoFocus required />
        </label>
        <label className={m.field}>
          Categoria
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset className={s.fieldset}>
          <legend>Como vende</legend>
          <div className={s.chips}>
            <label className={s.chip}>
              <input type="radio" name="kind" checked={kind === "custom"} onChange={() => setKind("custom")} /> Fabricação (sob orçamento)
            </label>
            <label className={s.chip}>
              <input type="radio" name="kind" checked={kind === "stock"} onChange={() => setKind("stock")} /> Pronta-entrega (compra no site)
            </label>
          </div>
        </fieldset>
      </div>
      <p className={s.hint}>
        O anúncio nasce como rascunho, fora da loja. Na próxima tela você completa descrição, ficha técnica, preço, cores e fotos, e depois publica.
      </p>
      {error && <p className={m.error}>{error}</p>}
      <div className="button-row">
        <button type="submit" className="button primary small" disabled={pending}>
          {pending ? "Criando…" : "Criar e continuar"}
        </button>
        <button type="button" className="button secondary small" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/* ---------------- Editar anúncio ---------------- */

function ListingEditor({ slug, edits, photos, enabled, onBack }: { slug: string; edits: CatalogEdits; photos: (string | null)[]; enabled: boolean; onBack: () => void }) {
  const override = edits.listings[slug];
  const created = edits.created[slug];
  const catalog = useMemo(() => withListing(slug, undefined)!, [slug]);
  const current = useMemo(() => withListing(slug, override)!, [slug, override]);
  const stock = catalog.kind === "stock";
  const initial = useMemo<ListingForm>(() => listingFormOf(current), [current]);
  // galeria: as fotos do anúncio com as trocas antigas de vitrine (posições 1 e 2)
  // (a imagem neutra de anúncio sem foto não entra na galeria)
  const gallery = useMemo(() => withPhotos(current, photos).photos.filter((src) => src !== NO_PHOTO), [current, photos]);

  const { pending, error, setError, run } = useAction();
  const [d, setD] = useState<ListingForm>(initial);
  const [price, setPrice] = useState(moneyText(initial.price));
  const [compareAt, setCompareAt] = useState(moneyText(initial.compareAt));
  const [chart, setChart] = useState(initial.sizeChart.join(", "));
  // textos automáticos da ficha técnica, como aparecem no site
  const autoSpecs = useMemo(() => defaultSpecs(current), [current]);
  const specTextOf = (f: ListingForm) => Object.fromEntries(EDITABLE_SPECS.map(({ key }) => [key, f.specs[key] ?? autoSpecs[key]])) as Record<SpecKey, string>;
  const [specText, setSpecText] = useState(() => specTextOf(initial));
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState<"reset" | "delete" | null>(null);
  const [colorQuery, setColorQuery] = useState("");
  const set = <K extends keyof ListingForm>(k: K, v: ListingForm[K]) => {
    setSaved(false);
    setD((x) => ({ ...x, [k]: v }));
  };
  const typed = (fn: (v: string) => void) => (e: { target: { value: string } }) => {
    setSaved(false);
    fn(e.target.value);
  };

  const draft = (): ListingForm | string => {
    const p = parseMoney(price);
    const c = parseMoney(compareAt);
    if (stock && (p === null || Number.isNaN(p))) return "Informe o preço de venda (ex.: 24,90).";
    if (Number.isNaN(c ?? 0)) return 'Preço "de" inválido (ex.: 29,90).';
    // só guarda o que difere dos textos automáticos da ficha técnica
    const specs: ListingForm["specs"] = {};
    for (const { key } of EDITABLE_SPECS) if (specText[key].trim() !== autoSpecs[key]) specs[key] = specText[key].trim();
    return {
      ...d,
      price: stock ? p! : d.price,
      compareAt: stock ? c : d.compareAt,
      sizeChart: chart
        .split(/[,;\n]/)
        .map((x) => x.trim())
        .filter(Boolean),
      highlights: d.highlights.filter((h) => h.title.trim() || h.text.trim()),
      extraSpecs: d.extraSpecs.filter((r) => r.label.trim() || r.value.trim()),
      specs,
    };
  };
  const dirty = (() => {
    const v = draft();
    // compara o conteúdo: depois de salvar, o que volta do banco vem com as chaves em outra ordem
    return typeof v === "string" || !sameData(v, initial);
  })();
  const edited = Object.keys(override ?? {}).some((k) => k !== "colorPhotos" && k !== "photos");

  const load = (f: ListingForm) => {
    setD(f);
    setPrice(moneyText(f.price));
    setCompareAt(moneyText(f.compareAt));
    setChart(f.sizeChart.join(", "));
    setSpecText(specTextOf(f));
  };

  const save = () => {
    const v = draft();
    if (typeof v === "string") return setError(v);
    run(
      () => saveListing(slug, v),
      () => {
        load(v);
        setSaved(true);
      },
    );
  };

  const toggleColor = (id: string) => {
    if (d.colors.includes(id)) {
      if (id === d.colors[0]) return;
      set(
        "colors",
        d.colors.filter((x) => x !== id),
      );
    } else set("colors", [...d.colors, id]);
  };
  const shownColors = palette.filter((c) => !colorQuery.trim() || c.name.toLowerCase().includes(colorQuery.trim().toLowerCase()));

  return (
    <div className={s.editor}>
      <div className={s.editorHead}>
        <button type="button" className="text-button" onClick={onBack}>
          <ArrowLeft size={16} /> Voltar para os anúncios
        </button>
        <div className={s.editorTitle}>
          <span className="eyebrow">
            {created ? "ANÚNCIO CADASTRADO NO PAINEL" : "EDITAR ANÚNCIO"} · {stock ? "PRONTA-ENTREGA" : "FABRICAÇÃO"}
          </span>
          <h2>{current.name}</h2>
        </div>
        <div className={s.headActions}>
          {(!created || created.published) && (
            <a className="button secondary small" href={`/produto/${slug}`} target="_blank" rel="noreferrer">
              Ver na loja <ExternalLink size={14} />
            </a>
          )}
          {created ? (
            confirm === "delete" ? (
              <>
                <button type="button" className={`button small ${m.danger}`} disabled={pending} onClick={() => run(() => deleteProduct(slug), onBack)}>
                  Confirmar: excluir anúncio
                </button>
                <button type="button" className="button secondary small" onClick={() => setConfirm(null)}>
                  Cancelar
                </button>
              </>
            ) : (
              <button type="button" className="button secondary small" onClick={() => setConfirm("delete")}>
                <Trash2 size={14} /> Excluir anúncio
              </button>
            )
          ) : (
            edited &&
            (confirm === "reset" ? (
              <>
                <button
                  type="button"
                  className={`button small ${m.danger}`}
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => resetListing(slug),
                      () => {
                        load(listingFormOf(catalog));
                        setConfirm(null);
                      },
                    )
                  }
                >
                  Confirmar: voltar ao texto original
                </button>
                <button type="button" className="button secondary small" onClick={() => setConfirm(null)}>
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                className="button secondary small"
                onClick={() => setConfirm("reset")}
                title="Volta texto, categoria, preço, cores e tamanhos ao catálogo original (as fotos ficam)"
              >
                <RotateCcw size={14} /> Restaurar original
              </button>
            ))
          )}
        </div>
      </div>

      {created && (
        <div className={s.publish} data-live={created.published || undefined}>
          <span>
            {created.published ? (
              <>
                <Eye size={16} /> <b>Publicado:</b> o anúncio está na loja.
              </>
            ) : (
              <>
                <EyeOff size={16} /> <b>Rascunho:</b> ainda não aparece na loja. Complete as informações, salve, envie ao menos a foto de capa e publique.
              </>
            )}
          </span>
          <button
            type="button"
            className={`button small ${created.published ? "secondary" : "primary"}`}
            disabled={!enabled || pending}
            onClick={() => run(() => setPublished(slug, !created.published))}
          >
            {created.published ? "Tirar da loja" : "Publicar anúncio"}
          </button>
        </div>
      )}

      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <section className="admin-panel">
          <h3 className={s.sectionTitle}>Título, categoria e descrição</h3>
          <label className={m.field}>
            Título do anúncio
            <input value={d.name} onChange={(e) => set("name", e.target.value)} maxLength={90} required />
          </label>
          <div className={m.row}>
            <label className={m.field}>
              Categoria
              <select value={d.category} onChange={(e) => set("category", e.target.value)}>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={m.field}>
              Modelo / gola
              <input value={d.subtitle} onChange={(e) => set("subtitle", e.target.value)} maxLength={80} placeholder="Ex.: Gola careca ou gola V" />
            </label>
          </div>
          <label className={m.field}>
            Descrição
            <textarea value={d.description} onChange={(e) => set("description", e.target.value)} maxLength={1500} rows={5} required />
          </label>
          <p className={s.hint}>Aparece na página do produto e no Google. Descreva o tecido, o conforto e para quem a peça é indicada.</p>
        </section>

        {stock && (
          <section className="admin-panel">
            <h3 className={s.sectionTitle}>Preço</h3>
            <div className={m.row}>
              <label className={m.field}>
                Preço por peça (R$)
                <input value={price} onChange={typed(setPrice)} inputMode="decimal" placeholder="24,90" required />
              </label>
              <label className={m.field}>
                Preço &quot;de&quot;, riscado (opcional)
                <input value={compareAt} onChange={typed(setCompareAt)} inputMode="decimal" placeholder="29,90" />
              </label>
            </div>
            <p className={s.hint}>
              Valor da peça lisa. A personalização (logo) soma conforme a técnica e a posição, pela tabela do painel em &quot;Preços do simulador&quot;, e
              os descontos por quantidade continuam valendo. É este valor que o checkout cobra.
            </p>
          </section>
        )}

        <section className="admin-panel">
          <h3 className={s.sectionTitle}>Ficha técnica</h3>
          <div className={m.row}>
            <label className={m.field}>
              Tecido
              <input value={d.fabric} onChange={(e) => set("fabric", e.target.value)} maxLength={60} required />
            </label>
            <label className={m.field}>
              Composição
              <input value={d.composition} onChange={(e) => set("composition", e.target.value)} maxLength={80} placeholder="Ex.: 67% poliéster + 33% viscose" />
            </label>
          </div>
          <div className={m.row}>
            <label className={m.field}>
              Observação do tecido
              <input value={d.fabricNote} onChange={(e) => set("fabricNote", e.target.value)} maxLength={80} placeholder="Ex.: Variação de tecido disponível" />
            </label>
            <label className={m.field}>
              Grade de tamanhos (fabricação)
              <input value={chart} onChange={typed(setChart)} placeholder="PP, P, M, G, GG" />
            </label>
          </div>
          <fieldset className={s.fieldset}>
            <legend>Técnicas de personalização</legend>
            <div className={s.chips}>
              {TECHNIQUE_OPTIONS.map((t) => (
                <label key={t} className={s.chip}>
                  <input
                    type="checkbox"
                    checked={d.techniques.includes(t)}
                    onChange={(e) =>
                      set("techniques", e.target.checked ? TECHNIQUE_OPTIONS.filter((x) => x === t || d.techniques.includes(x)) : d.techniques.filter((x) => x !== t))
                    }
                  />
                  {t}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className={s.fieldset}>
            <legend>Destaques</legend>
            <p className={s.hint}>Aparecem na lista de vantagens da página do produto (ex.: &quot;Costura reforçada&quot;).</p>
            {d.highlights.map((h, i) => (
              <div key={i} className={s.highlight}>
                <input
                  value={h.title}
                  onChange={(e) =>
                    set(
                      "highlights",
                      d.highlights.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)),
                    )
                  }
                  maxLength={60}
                  placeholder="Título"
                  aria-label={`Título do destaque ${i + 1}`}
                />
                <input
                  value={h.text}
                  onChange={(e) =>
                    set(
                      "highlights",
                      d.highlights.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)),
                    )
                  }
                  maxLength={200}
                  placeholder="Explicação curta"
                  aria-label={`Texto do destaque ${i + 1}`}
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() =>
                    set(
                      "highlights",
                      d.highlights.filter((_, k) => k !== i),
                    )
                  }
                  aria-label={`Remover destaque ${i + 1}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {d.highlights.length < 8 && (
              <button type="button" className="button secondary small" onClick={() => set("highlights", [...d.highlights, { title: "", text: "" }])}>
                <Plus size={14} /> Adicionar destaque
              </button>
            )}
          </fieldset>
          <fieldset className={s.fieldset}>
            <legend>Outras linhas da ficha técnica</legend>
            <p className={s.hint}>
              Produto, modelo, categoria, tecido, composição, tamanhos, cores, destaques e técnicas vêm dos campos acima. Estas linhas você edita aqui; deixe em
              branco para não mostrar a linha no site.
            </p>
            {EDITABLE_SPECS.map(({ key, label }) => (
              <label key={key} className={`${m.field} ${s.specField}`}>
                <span>
                  {label}
                  {specText[key].trim() !== autoSpecs[key] && (
                    <button
                      type="button"
                      className={s.linkBtn}
                      onClick={() => {
                        setSaved(false);
                        setSpecText((x) => ({ ...x, [key]: autoSpecs[key] }));
                      }}
                    >
                      voltar ao texto automático
                    </button>
                  )}
                </span>
                <textarea
                  rows={key === "cuidados" ? 3 : 1}
                  maxLength={400}
                  value={specText[key]}
                  placeholder="(linha escondida)"
                  onChange={(e) => {
                    setSaved(false);
                    const v = e.target.value;
                    setSpecText((x) => ({ ...x, [key]: v }));
                  }}
                />
              </label>
            ))}
          </fieldset>
          <fieldset className={s.fieldset}>
            <legend>Linhas extras da ficha técnica</legend>
            {d.extraSpecs.map((r, i) => (
              <div key={i} className={s.highlight}>
                <input
                  value={r.label}
                  onChange={(e) =>
                    set(
                      "extraSpecs",
                      d.extraSpecs.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)),
                    )
                  }
                  maxLength={60}
                  placeholder="Nome da linha (ex.: Gramatura)"
                  aria-label={`Nome da linha extra ${i + 1}`}
                />
                <input
                  value={r.value}
                  onChange={(e) =>
                    set(
                      "extraSpecs",
                      d.extraSpecs.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)),
                    )
                  }
                  maxLength={400}
                  placeholder="Texto (ex.: 160 g/m²)"
                  aria-label={`Texto da linha extra ${i + 1}`}
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() =>
                    set(
                      "extraSpecs",
                      d.extraSpecs.filter((_, k) => k !== i),
                    )
                  }
                  aria-label={`Remover linha extra ${i + 1}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {d.extraSpecs.length < 12 && (
              <button type="button" className="button secondary small" onClick={() => set("extraSpecs", [...d.extraSpecs, { label: "", value: "" }])}>
                <Plus size={14} /> Adicionar linha
              </button>
            )}
          </fieldset>
        </section>

        <section className="admin-panel">
          <h3 className={s.sectionTitle}>Cores</h3>
          <label className={m.field}>
            Cor da peça nas fotos
            <select value={d.colors[0]} onChange={(e) => set("colors", [e.target.value, ...d.colors.filter((x) => x !== e.target.value)])}>
              {d.colors.map((id) => (
                <option key={id} value={id}>
                  {getColor(id)?.name ?? id}
                </option>
              ))}
            </select>
          </label>
          <p className={s.hint}>
            Precisa ser a cor da peça que aparece nas fotos: é a partir dela que o site pinta as outras cores. Se trocar as fotos da peça por uma de outra cor,
            troque aqui também.
          </p>
          <div className={s.colorHead}>
            <span>
              {d.colors.length} {d.colors.length === 1 ? "cor à venda" : "cores à venda"}
            </span>
            <label className={s.search}>
              <Search size={15} />
              <input value={colorQuery} onChange={(e) => setColorQuery(e.target.value)} placeholder="Buscar cor" aria-label="Buscar cor" />
            </label>
          </div>
          <div className={s.colors}>
            {shownColors.map((c) => {
              const on = d.colors.includes(c.id);
              const photoColor = c.id === d.colors[0];
              return (
                <button
                  key={c.id}
                  type="button"
                  className={s.color}
                  aria-pressed={on}
                  disabled={photoColor}
                  title={photoColor ? "É a cor das fotos: escolha outra cor das fotos antes de tirar esta" : undefined}
                  onClick={() => toggleColor(c.id)}
                >
                  <Swatch c={c} />
                  {c.name}
                  {photoColor && <small>fotos</small>}
                </button>
              );
            })}
          </div>
        </section>

        {stock && (
          <section className="admin-panel">
            <h3 className={s.sectionTitle}>Tamanhos à venda</h3>
            <p className={s.hint}>Os tamanhos que o cliente pode escolher na compra pelo site.</p>
            <div className={s.chips}>
              {SIZE_OPTIONS.map((z) => (
                <label key={z} className={s.chip}>
                  <input
                    type="checkbox"
                    checked={d.sizes.includes(z)}
                    onChange={(e) => set("sizes", e.target.checked ? SIZE_OPTIONS.filter((x) => x === z || d.sizes.includes(x)) : d.sizes.filter((x) => x !== z))}
                  />
                  {z}
                </label>
              ))}
            </div>
          </section>
        )}

        <div className={s.saveBar} data-dirty={dirty || undefined}>
          <span>
            {error ? (
              <b className={s.saveError}>{error}</b>
            ) : saved && !dirty ? (
              "Anúncio salvo. A loja já mostra a nova versão."
            ) : dirty ? (
              "Alterações não salvas"
            ) : (
              "Sem alterações"
            )}
          </span>
          <div className="button-row">
            {dirty && (
              <button
                type="button"
                className="button secondary small"
                onClick={() => {
                  load(initial);
                  setError(null);
                }}
                disabled={pending}
              >
                Descartar
              </button>
            )}
            <button type="submit" className="button primary small" disabled={!enabled || pending || !dirty}>
              {pending ? "Salvando…" : "Salvar anúncio"}
            </button>
          </div>
        </div>
      </form>

      <section className="admin-panel">
        <h3 className={s.sectionTitle}>Galeria do anúncio</h3>
        <p className={s.hint}>Fotos comerciais (pessoa vestindo, detalhes, ambiente). Elas não mudam de cor; quem muda de cor é a peça sozinha, logo abaixo.</p>
        <GalleryEditor slug={slug} saved={gallery} enabled={enabled} />
      </section>

      <section className="admin-panel">
        <h3 className={s.sectionTitle}>Mockups da peça (simulador e troca de cor)</h3>
        <p className={s.hint}>
          Valem para todas as cores: o site pinta a peça na cor que o cliente escolhe. Para uma cor ter foto própria (ex.: só o laranja), envie em
          &quot;Fotos por cor&quot;, logo abaixo.
        </p>
        <div className={s.gallery}>
          <ProductPhotoSlots product={catalog} photos={photos} enabled={enabled} pieceOnly />
        </div>
      </section>

      <ColorPhotos slug={slug} colors={current.colors} photos={current.colorPhotos ?? {}} enabled={enabled} />
    </div>
  );
}

/* ---------------- Fotos por cor ---------------- */

/** Posições das fotos de uma cor (as mesmas das fotos do produto): peça sozinha primeiro, que é a do simulador. */
const COLOR_SLOTS = [
  { index: 2, label: "Peça: frente", group: "piece" },
  { index: 3, label: "Peça: costas", group: "piece" },
  { index: 4, label: "Peça: lado", group: "piece" },
  { index: 0, label: "Vestindo 1 (frente)", group: "model" },
  { index: 1, label: "Vestindo 2 (costas)", group: "model" },
] as const;

function ColorPhotos({ slug, colors, photos, enabled }: { slug: string; colors: string[]; photos: Record<string, string[]>; enabled: boolean }) {
  const { pending, error, setError, run } = useAction();
  const [extra, setExtra] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const rows = [...Object.keys(photos), ...extra.filter((c) => !photos[c])];
  const free = colors.filter((c) => !rows.includes(c));

  const onFile = async (color: string, index: number, file?: File) => {
    if (!file) return;
    setBusy(`${color}-${index}`);
    setError(null);
    try {
      const url = await uploadImage(file, "produtos");
      run(() => setColorPhoto(slug, color, index, url));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no envio da imagem.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="admin-panel" aria-busy={pending}>
      <h3 className={s.sectionTitle}>Fotos por cor (opcional)</h3>
      <p className={s.hint}>
        Para uma cor ter fotos próprias. <b>Peça (frente, costas, lado):</b> no simulador, quando o cliente escolhe esta cor, aparecem estas fotos no
        lugar dos mockups acima pintados na cor; as outras cores continuam como estão. Use o mesmo enquadramento dos mockups (foto quadrada, só a
        peça, fundo liso). <b>Vestindo:</b> na página do produto, a foto vestindo da cor escolhida passa a ser a primeira da galeria. Escolha a cor
        em &quot;Adicionar fotos de uma cor&quot; e envie só as fotos que quiser.
      </p>
      {error && <p className={m.error}>{error}</p>}
      <div className={s.colorRows}>
        {rows.map((color) => {
          const c = getColor(color);
          const list = photos[color] ?? [];
          return (
            <div key={color} className={s.colorRow}>
              <span className={s.colorName}>
                {c && <Swatch c={c} />} {c?.name ?? color}
                {!colors.includes(color) && <small>(cor fora da lista à venda)</small>}
              </span>
              <div className={m.slots}>
                {COLOR_SLOTS.map(({ index, label }) => {
                  const src = list[index];
                  const key = `${color}-${index}`;
                  return (
                    <div key={index} className={m.slot}>
                      <span className={m.slotImg}>
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt="" loading="lazy" />
                        ) : (
                          <span className={s.emptySlot}>
                            <ImagePlus size={20} />
                          </span>
                        )}
                        {busy === key && <span className={m.uploading}>Enviando…</span>}
                      </span>
                      <small>{label}</small>
                      <div className={m.slotActions}>
                        <button type="button" className="button secondary small" disabled={!enabled || pending || !!busy} onClick={() => inputs.current[key]?.click()}>
                          <Upload size={14} /> {src ? "Trocar" : "Enviar"}
                        </button>
                        {src && (
                          <button
                            type="button"
                            className="icon-button"
                            disabled={pending || !!busy}
                            onClick={() => run(() => setColorPhoto(slug, color, index, null))}
                            aria-label="Remover foto"
                            title="Remover foto"
                          >
                            <X size={15} />
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
                          onFile(color, index, e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {free.length > 0 && (
        <label className={`${m.field} ${s.addColor}`}>
          Adicionar fotos de uma cor
          <select
            value=""
            disabled={!enabled}
            onChange={(e) => {
              const v = e.target.value;
              if (v) setExtra((x) => [...x, v]);
            }}
          >
            <option value="">Escolha a cor…</option>
            {free.map((id) => (
              <option key={id} value={id}>
                {getColor(id)?.name ?? id}
              </option>
            ))}
          </select>
        </label>
      )}
    </section>
  );
}
