"use client";
// Painel → Anúncios: cada produto abre "Editar anúncio" (título, descrição, ficha técnica, preço,
// cores, tamanhos e galeria). O texto é salvo no botão "Salvar anúncio"; as fotos, a cada envio.
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  ImagePlus,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  colors as palette,
  getCategory,
  getColor,
  money,
  products,
  withListing,
  type Color,
  type ListingOverrides,
} from "@/lib/catalog";
import type { PhotoOverrides } from "@/lib/banners";
import {
  listingFieldsOf,
  SIZE_OPTIONS,
  TECHNIQUE_OPTIONS,
  type ListingForm,
} from "@/lib/listing";
import {
  resetListing,
  saveListing,
  setColorPhoto,
} from "@/app/admin/listing-actions";
import {
  ACCEPT,
  ProductPhotoSlots,
  uploadImage,
  useAction,
} from "./MediaAdmin";
import m from "./MediaAdmin.module.css";
import s from "./ListingsAdmin.module.css";

const NO_PHOTOS: (string | null)[] = [null, null, null, null, null];
type Filter = "todos" | "stock" | "custom" | "editados";

/** "24,90" → 24.9; vazio → null; inválido → NaN */
const parseMoney = (v: string) => {
  const t = v
    .replace(/[^\d,.]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  return t ? Number(t) : null;
};
const moneyText = (n: number | null) =>
  n === null ? "" : n.toFixed(2).replace(".", ",");

function Swatch({ c }: { c: Color }) {
  return (
    <span
      className={s.swatch}
      data-mescla={c.pattern === "mescla" || undefined}
      style={{ background: c.hex }}
      aria-hidden
    />
  );
}

export function ListingsAdmin({
  listings,
  photos,
  enabled,
}: {
  listings: ListingOverrides;
  photos: PhotoOverrides;
  enabled: boolean;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");

  if (editing)
    return (
      <ListingEditor
        key={editing}
        slug={editing}
        override={listings[editing]}
        photos={photos[editing] ?? NO_PHOTOS}
        enabled={enabled}
        onBack={() => setEditing(null)}
      />
    );

  const isEdited = (slug: string) =>
    Object.keys(listings[slug] ?? {}).some((k) => k !== "colorPhotos");
  const q = query.trim().toLowerCase();
  const list = products.filter(
    (p) =>
      (!q ||
        `${p.name} ${p.subtitle} ${getCategory(p.category)?.name}`
          .toLowerCase()
          .includes(q)) &&
      (filter === "todos" ||
        (filter === "editados"
          ? isEdited(p.slug) || photos[p.slug]?.some(Boolean)
          : p.kind === filter)),
  );

  return (
    <div className="admin-panel">
      <div className="panel-heading">
        <div>
          <h3>Anúncios</h3>
          <p>
            Clique num produto para editar o anúncio: título, descrição, ficha
            técnica, preço, cores, tamanhos e fotos.
          </p>
        </div>
      </div>
      <div className={s.body}>
        {!enabled && (
          <p className={m.note}>
            Banco de dados não configurado: dá para ver os anúncios, mas não
            salvar alterações.
          </p>
        )}
        <div className={s.toolbar}>
          <label className={s.search}>
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produto"
              aria-label="Buscar produto"
            />
          </label>
          <div className={s.tabs} role="tablist" aria-label="Filtrar anúncios">
            {(
              [
                ["todos", "Todos"],
                ["stock", "Pronta-entrega"],
                ["custom", "Fabricação"],
                ["editados", "Editados"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={filter === id}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <ul className={s.grid}>
          {list.map((p) => (
            <li key={p.slug}>
              <button
                type="button"
                className={s.card}
                onClick={() => setEditing(p.slug)}
              >
                <span className={s.cardImg}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photos[p.slug]?.[0] ?? p.photos[0]}
                    alt=""
                    loading="lazy"
                  />
                  {isEdited(p.slug) && <em>Editado</em>}
                </span>
                <span className={s.cardBody}>
                  <small>
                    {p.kind === "stock" ? "Pronta-entrega" : "Fabricação"} ·{" "}
                    {getCategory(p.category)?.name}
                  </small>
                  <strong>{p.name}</strong>
                  <span>
                    {p.kind === "stock"
                      ? `${money(p.price)} / peça`
                      : "Sob orçamento"}
                  </span>
                </span>
                <span className={s.cardEdit}>
                  <Pencil size={14} /> Editar anúncio
                </span>
              </button>
            </li>
          ))}
        </ul>
        {!list.length && (
          <p className="empty-state">Nenhum produto encontrado.</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- Editar anúncio ---------------- */

function ListingEditor({
  slug,
  override,
  photos,
  enabled,
  onBack,
}: {
  slug: string;
  override: ListingOverrides[string] | undefined;
  photos: (string | null)[];
  enabled: boolean;
  onBack: () => void;
}) {
  const catalog = useMemo(() => withListing(slug, undefined)!, [slug]);
  const current = useMemo(() => withListing(slug, override)!, [slug, override]);
  const stock = catalog.kind === "stock";
  const initial = useMemo<ListingForm>(() => {
    const { colorPhotos: _ignored, ...rest } = listingFieldsOf(current);
    return rest;
  }, [current]);

  const { pending, error, setError, run } = useAction();
  const [d, setD] = useState<ListingForm>(initial);
  const [price, setPrice] = useState(moneyText(initial.price));
  const [compareAt, setCompareAt] = useState(moneyText(initial.compareAt));
  const [chart, setChart] = useState(initial.sizeChart.join(", "));
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [colorQuery, setColorQuery] = useState("");
  const set = <K extends keyof ListingForm>(k: K, v: ListingForm[K]) => {
    setSaved(false);
    setD((x) => ({ ...x, [k]: v }));
  };

  const draft = (): ListingForm | string => {
    const p = parseMoney(price);
    const c = parseMoney(compareAt);
    if (stock && (p === null || Number.isNaN(p)))
      return "Informe o preço de venda (ex.: 24,90).";
    if (Number.isNaN(c ?? 0)) return 'Preço "de" inválido (ex.: 29,90).';
    return {
      ...d,
      price: stock ? p! : d.price,
      compareAt: stock ? c : d.compareAt,
      sizeChart: chart
        .split(/[,;\n]/)
        .map((x) => x.trim())
        .filter(Boolean),
      highlights: d.highlights.filter((h) => h.title.trim() || h.text.trim()),
    };
  };
  const dirty = (() => {
    const v = draft();
    return (
      typeof v === "string" || JSON.stringify(v) !== JSON.stringify(initial)
    );
  })();
  const edited = Object.keys(override ?? {}).some((k) => k !== "colorPhotos");

  const load = (f: ListingForm) => {
    setD(f);
    setPrice(moneyText(f.price));
    setCompareAt(moneyText(f.compareAt));
    setChart(f.sizeChart.join(", "));
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
  const shownColors = palette.filter(
    (c) =>
      !colorQuery.trim() ||
      c.name.toLowerCase().includes(colorQuery.trim().toLowerCase()),
  );

  return (
    <div className={s.editor}>
      <div className={s.editorHead}>
        <button type="button" className="text-button" onClick={onBack}>
          <ArrowLeft size={16} /> Voltar para os anúncios
        </button>
        <div className={s.editorTitle}>
          <span className="eyebrow">
            EDITAR ANÚNCIO · {stock ? "PRONTA-ENTREGA" : "FABRICAÇÃO"}
          </span>
          <h2>{current.name}</h2>
        </div>
        <div className={s.headActions}>
          <a
            className="button secondary small"
            href={`/produto/${slug}`}
            target="_blank"
            rel="noreferrer"
          >
            Ver na loja <ExternalLink size={14} />
          </a>
          {edited &&
            (confirmReset ? (
              <>
                <button
                  type="button"
                  className={`button small ${m.danger}`}
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => resetListing(slug),
                      () => {
                        const { colorPhotos: _ignored, ...rest } =
                          listingFieldsOf(catalog);
                        load(rest);
                        setConfirmReset(false);
                      },
                    )
                  }
                >
                  Confirmar: voltar ao texto original
                </button>
                <button
                  type="button"
                  className="button secondary small"
                  onClick={() => setConfirmReset(false)}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                className="button secondary small"
                onClick={() => setConfirmReset(true)}
                title="Volta texto, preço, cores e tamanhos ao catálogo original (as fotos ficam)"
              >
                <RotateCcw size={14} /> Restaurar original
              </button>
            ))}
        </div>
      </div>

      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <section className="admin-panel">
          <h3 className={s.sectionTitle}>Título e descrição</h3>
          <label className={m.field}>
            Título do anúncio
            <input
              value={d.name}
              onChange={(e) => set("name", e.target.value)}
              maxLength={90}
              required
            />
          </label>
          <label className={m.field}>
            Modelo / gola
            <input
              value={d.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              maxLength={80}
              placeholder="Ex.: Gola careca ou gola V"
            />
          </label>
          <label className={m.field}>
            Descrição
            <textarea
              value={d.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={1500}
              rows={5}
              required
            />
          </label>
          <p className={s.hint}>
            Aparece na página do produto e no Google. Descreva o tecido, o
            conforto e para quem a peça é indicada.
          </p>
        </section>

        {stock && (
          <section className="admin-panel">
            <h3 className={s.sectionTitle}>Preço</h3>
            <div className={m.row}>
              <label className={m.field}>
                Preço por peça (R$)
                <input
                  value={price}
                  onChange={(e) => (setSaved(false), setPrice(e.target.value))}
                  inputMode="decimal"
                  placeholder="24,90"
                  required
                />
              </label>
              <label className={m.field}>
                Preço &quot;de&quot;, riscado (opcional)
                <input
                  value={compareAt}
                  onChange={(e) => (
                    setSaved(false),
                    setCompareAt(e.target.value)
                  )}
                  inputMode="decimal"
                  placeholder="29,90"
                />
              </label>
            </div>
            <p className={s.hint}>
              Valor da peça lisa. A personalização soma por posição da logo e os
              descontos por quantidade continuam valendo. É este valor que o
              checkout cobra.
            </p>
          </section>
        )}

        <section className="admin-panel">
          <h3 className={s.sectionTitle}>Ficha técnica</h3>
          <div className={m.row}>
            <label className={m.field}>
              Tecido
              <input
                value={d.fabric}
                onChange={(e) => set("fabric", e.target.value)}
                maxLength={60}
                required
              />
            </label>
            <label className={m.field}>
              Composição
              <input
                value={d.composition}
                onChange={(e) => set("composition", e.target.value)}
                maxLength={80}
                placeholder="Ex.: 67% poliéster + 33% viscose"
              />
            </label>
          </div>
          <div className={m.row}>
            <label className={m.field}>
              Observação do tecido
              <input
                value={d.fabricNote}
                onChange={(e) => set("fabricNote", e.target.value)}
                maxLength={80}
                placeholder="Ex.: Variação de tecido disponível"
              />
            </label>
            <label className={m.field}>
              Grade de tamanhos (fabricação)
              <input
                value={chart}
                onChange={(e) => (setSaved(false), setChart(e.target.value))}
                placeholder="PP, P, M, G, GG"
              />
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
                      set(
                        "techniques",
                        e.target.checked
                          ? TECHNIQUE_OPTIONS.filter(
                              (x) => x === t || d.techniques.includes(x),
                            )
                          : d.techniques.filter((x) => x !== t),
                      )
                    }
                  />
                  {t}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className={s.fieldset}>
            <legend>Destaques</legend>
            <p className={s.hint}>
              Aparecem na lista de vantagens da página do produto (ex.:
              &quot;Costura reforçada&quot;).
            </p>
            {d.highlights.map((h, i) => (
              <div key={i} className={s.highlight}>
                <input
                  value={h.title}
                  onChange={(e) =>
                    set(
                      "highlights",
                      d.highlights.map((x, k) =>
                        k === i ? { ...x, title: e.target.value } : x,
                      ),
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
                      d.highlights.map((x, k) =>
                        k === i ? { ...x, text: e.target.value } : x,
                      ),
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
              <button
                type="button"
                className="button secondary small"
                onClick={() =>
                  set("highlights", [...d.highlights, { title: "", text: "" }])
                }
              >
                <Plus size={14} /> Adicionar destaque
              </button>
            )}
          </fieldset>
        </section>

        <section className="admin-panel">
          <h3 className={s.sectionTitle}>Cores</h3>
          <label className={m.field}>
            Cor da peça nas fotos
            <select
              value={d.colors[0]}
              onChange={(e) =>
                set("colors", [
                  e.target.value,
                  ...d.colors.filter((x) => x !== e.target.value),
                ])
              }
            >
              {d.colors.map((id) => (
                <option key={id} value={id}>
                  {getColor(id)?.name ?? id}
                </option>
              ))}
            </select>
          </label>
          <p className={s.hint}>
            Precisa ser a cor da peça que aparece nas fotos: é a partir dela que
            o site pinta as outras cores. Se trocar as fotos da peça por uma de
            outra cor, troque aqui também.
          </p>
          <div className={s.colorHead}>
            <span>
              {d.colors.length}{" "}
              {d.colors.length === 1 ? "cor à venda" : "cores à venda"}
            </span>
            <label className={s.search}>
              <Search size={15} />
              <input
                value={colorQuery}
                onChange={(e) => setColorQuery(e.target.value)}
                placeholder="Buscar cor"
                aria-label="Buscar cor"
              />
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
                  title={
                    photoColor
                      ? "É a cor das fotos: escolha outra cor das fotos antes de tirar esta"
                      : undefined
                  }
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
            <p className={s.hint}>
              Os tamanhos que o cliente pode escolher na compra pelo site.
            </p>
            <div className={s.chips}>
              {SIZE_OPTIONS.map((z) => (
                <label key={z} className={s.chip}>
                  <input
                    type="checkbox"
                    checked={d.sizes.includes(z)}
                    onChange={(e) =>
                      set(
                        "sizes",
                        e.target.checked
                          ? SIZE_OPTIONS.filter(
                              (x) => x === z || d.sizes.includes(x),
                            )
                          : d.sizes.filter((x) => x !== z),
                      )
                    }
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
                onClick={() => (load(initial), setError(null))}
                disabled={pending}
              >
                Descartar
              </button>
            )}
            <button
              type="submit"
              className="button primary small"
              disabled={!enabled || pending || !dirty}
            >
              {pending ? "Salvando…" : "Salvar anúncio"}
            </button>
          </div>
        </div>
      </form>

      <section className="admin-panel">
        <h3 className={s.sectionTitle}>Galeria</h3>
        <p className={s.hint}>
          As fotos são salvas assim que enviadas. As da peça sozinha (frente,
          costas e lado) são separadas das fotos vestindo.
        </p>
        <div className={s.gallery}>
          <ProductPhotoSlots
            product={catalog}
            photos={photos}
            enabled={enabled}
          />
        </div>
      </section>

      <ColorPhotos
        slug={slug}
        colors={current.colors}
        photos={current.colorPhotos ?? {}}
        enabled={enabled}
      />
    </div>
  );
}

/* ---------------- Fotos vestindo por cor ---------------- */

function ColorPhotos({
  slug,
  colors,
  photos,
  enabled,
}: {
  slug: string;
  colors: string[];
  photos: Record<string, string[]>;
  enabled: boolean;
}) {
  const { pending, error, setError, run } = useAction();
  const [extra, setExtra] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const rows = [...Object.keys(photos), ...extra.filter((c) => !photos[c])];
  const free = colors.filter((c) => !rows.includes(c));

  const onFile = async (color: string, index: 0 | 1, file?: File) => {
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
      <h3 className={s.sectionTitle}>Fotos vestindo por cor (opcional)</h3>
      <p className={s.hint}>
        Quando o cliente escolhe uma cor na página do produto, as fotos de
        pessoa vestindo dessa cor aparecem no lugar das fotos padrão. Cor sem
        foto própria continua mostrando a foto padrão, e a peça sozinha muda de
        cor. Use fotos verticais (4:5), no mesmo estilo das fotos da vitrine.
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
                {!colors.includes(color) && (
                  <small>(cor fora da lista à venda)</small>
                )}
              </span>
              <div className={m.slots}>
                {([0, 1] as const).map((index) => {
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
                        {busy === key && (
                          <span className={m.uploading}>Enviando…</span>
                        )}
                      </span>
                      <small>
                        {index ? "Vestindo 2 (costas)" : "Vestindo 1 (frente)"}
                      </small>
                      <div className={m.slotActions}>
                        <button
                          type="button"
                          className="button secondary small"
                          disabled={!enabled || pending || !!busy}
                          onClick={() => inputs.current[key]?.click()}
                        >
                          <Upload size={14} /> {src ? "Trocar" : "Enviar"}
                        </button>
                        {src && (
                          <button
                            type="button"
                            className="icon-button"
                            disabled={pending || !!busy}
                            onClick={() =>
                              run(() => setColorPhoto(slug, color, index, null))
                            }
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
