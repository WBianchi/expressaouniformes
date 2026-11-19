"use client";
// Painel → Categorias: renomear, descrever, criar e excluir categorias e trocar a foto de cada uma.
// O endereço da categoria não muda ao renomear: os anúncios continuam ligados a ela.
import { useRef, useState } from "react";
import { Plus, RotateCcw, Trash2, Upload, X } from "lucide-react";
import { categories, categoryBaseName, products, type CatalogEdits, type Category } from "@/lib/catalog";
import type { CategoryPhotos } from "@/lib/site-media";
import { categoryIconLabels, categoryIcons, type CategoryIconName } from "@/lib/category-icons";
import { createCategory, deleteCategory, saveCategory } from "@/app/admin/category-actions";
import { resetCategoryPhoto, setCategoryPhoto, setCategoryShowName } from "@/app/admin/media-actions";
import { CategoryIcon } from "@/components/ui/primitives";
import { ACCEPT, uploadImage, useAction } from "./MediaAdmin";
import m from "./MediaAdmin.module.css";
import s from "./CategoriesAdmin.module.css";

const iconOf = (c: Pick<Category, "icon">): CategoryIconName => ((categoryIcons as readonly string[]).includes(c.icon) ? (c.icon as CategoryIconName) : "Shirt");

export function CategoriesAdmin({ photos, edits, enabled }: { photos: CategoryPhotos; edits: CatalogEdits; enabled: boolean }) {
  const [creating, setCreating] = useState(false);
  // anúncios em cada categoria (os da loja e os rascunhos cadastrados no painel)
  const count = (slug: string) =>
    products.filter((p) => p.category === slug).length +
    Object.entries(edits.created).filter(([sl, c]) => !c.published && (edits.listings[sl]?.category ?? c.category) === slug).length;

  return (
    <div className="admin-panel">
      <div className="panel-heading">
        <div>
          <h3>Categorias</h3>
          <p>
            Renomeie, crie categorias e troque a foto de cada uma. Elas aparecem na home, no menu Produtos, nos filtros
            da loja e no rodapé. Para mudar a categoria de um produto, abra o anúncio em Anúncios.
          </p>
        </div>
        <button type="button" className="button primary small" disabled={!enabled} onClick={() => setCreating(true)}>
          <Plus size={15} /> Nova categoria
        </button>
      </div>
      <div className={s.body}>
        {!enabled && <p className={m.note}>Banco de dados não configurado: não é possível salvar alterações.</p>}
        {creating && <NewCategory onClose={() => setCreating(false)} />}
        <ul className={s.list}>
          {categories.map((c) => (
            <CategoryCard key={c.slug} category={c} baseName={categoryBaseName(c.slug) ?? c.name} photo={photos[c.slug]} count={count(c.slug)} enabled={enabled} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function NewCategory({ onClose }: { onClose: () => void }) {
  const { pending, error, run } = useAction();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<CategoryIconName>("Shirt");
  return (
    <form
      className={s.newForm}
      onSubmit={(e) => {
        e.preventDefault();
        run(() => createCategory({ name, description, icon }), onClose);
      }}
    >
      <div className={s.newHead}>
        <h4>Nova categoria</h4>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar">
          <X size={16} />
        </button>
      </div>
      <div className={s.fields}>
        <label className={m.field}>
          Nome
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Ex.: Uniformes escolares" autoFocus required />
        </label>
        <label className={m.field}>
          Ícone
          <select value={icon} onChange={(e) => setIcon(e.target.value as CategoryIconName)}>
            {categoryIcons.map((i) => (
              <option key={i} value={i}>
                {categoryIconLabels[i]}
              </option>
            ))}
          </select>
        </label>
        <label className={`${m.field} ${s.wide}`}>
          Descrição curta (opcional)
          <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={160} placeholder="Aparece no Google e no topo da categoria na loja" />
        </label>
      </div>
      <p className={s.hint}>Depois de criar, envie a foto da categoria e escolha a categoria nos anúncios (em Anúncios → Editar anúncio).</p>
      {error && <p className={m.error}>{error}</p>}
      <div className="button-row">
        <button type="submit" className="button primary small" disabled={pending}>
          {pending ? "Criando…" : "Criar categoria"}
        </button>
        <button type="button" className="button secondary small" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function CategoryCard({
  category: c,
  baseName,
  photo,
  count,
  enabled,
}: {
  category: Category;
  /** nome original (o que vem escrito na imagem padrão) */
  baseName: string;
  photo: CategoryPhotos[string] | undefined;
  count: number;
  enabled: boolean;
}) {
  const { pending, error, setError, run } = useAction();
  const [name, setName] = useState(c.name);
  const [description, setDescription] = useState(c.description);
  const [icon, setIcon] = useState<CategoryIconName>(iconOf(c));
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const dirty = name !== c.name || description !== c.description || icon !== iconOf(c);
  // foto padrão já traz o nome escrito; categoria nova (sem foto própria) mostra o nome por cima
  const showName = photo ? photo.showName : !!c.created;

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadImage(file, "categorias");
      run(() => setCategoryPhoto(c.slug, url));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no envio da imagem.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={s.card} aria-busy={pending}>
      <div className={s.photoCol}>
        <span className={m.slotImg}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo?.url ?? c.image} alt="" loading="lazy" />
          {showName && <span className={m.catName}>{c.name}</span>}
          {busy && <span className={m.uploading}>Enviando…</span>}
          <em>{photo ? "Personalizada" : c.created ? "Sem foto" : "Padrão"}</em>
        </span>
        {photo && (
          <label className={m.check}>
            <input type="checkbox" checked={photo.showName} disabled={pending} onChange={(e) => run(() => setCategoryShowName(c.slug, e.target.checked))} />
            Mostrar o nome sobre a foto
          </label>
        )}
        <div className={m.slotActions}>
          <button type="button" className="button secondary small" disabled={!enabled || pending || busy} onClick={() => input.current?.click()}>
            <Upload size={14} /> {photo ? "Trocar foto" : "Enviar foto"}
          </button>
          {photo && (
            <button
              type="button"
              className="icon-button"
              disabled={pending || busy}
              onClick={() => run(() => resetCategoryPhoto(c.slug))}
              aria-label="Voltar para a imagem padrão"
              title="Voltar para a imagem padrão"
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(false);
          run(() => saveCategory(c.slug, { name, description, icon }), () => setSaved(true));
        }}
      >
        <div className={s.formHead}>
          <span className={s.icon}>
            <CategoryIcon name={icon} size={18} />
          </span>
          <small>
            {count} {count === 1 ? "anúncio" : "anúncios"} · /loja?categoria={c.slug}
            {c.created ? " · criada no painel" : ""}
          </small>
        </div>
        <div className={s.fields}>
          <label className={m.field}>
            Nome
            <input
              value={name}
              onChange={(e) => {
                setSaved(false);
                setName(e.target.value);
              }}
              maxLength={40}
              required
            />
          </label>
          <label className={m.field}>
            Ícone
            <select
              value={icon}
              onChange={(e) => {
                setSaved(false);
                setIcon(e.target.value as CategoryIconName);
              }}
            >
              {categoryIcons.map((i) => (
                <option key={i} value={i}>
                  {categoryIconLabels[i]}
                </option>
              ))}
            </select>
          </label>
          <label className={`${m.field} ${s.wide}`}>
            Descrição curta
            <input
              value={description}
              onChange={(e) => {
                setSaved(false);
                setDescription(e.target.value);
              }}
              maxLength={160}
            />
          </label>
        </div>
        {!photo && !c.created && c.name !== baseName && (
          <p className={m.note}>A imagem padrão traz o nome antigo escrito na arte. Envie uma foto nova para esta categoria.</p>
        )}
        {error && <p className={m.error}>{error}</p>}
        <div className={s.actions}>
          <button type="submit" className="button primary small" disabled={!enabled || pending || !dirty}>
            {pending ? "Salvando…" : "Salvar"}
          </button>
          {dirty && (
            <button
              type="button"
              className="button secondary small"
              onClick={() => {
                setName(c.name);
                setDescription(c.description);
                setIcon(iconOf(c));
              }}
            >
              Descartar
            </button>
          )}
          {saved && !dirty && <span className={s.ok}>Salvo. O novo nome já aparece no site.</span>}
          {c.created &&
            (confirm ? (
              <>
                <button type="button" className={`button small ${m.danger}`} disabled={pending} onClick={() => run(() => deleteCategory(c.slug))}>
                  Confirmar exclusão
                </button>
                <button type="button" className="button secondary small" onClick={() => setConfirm(false)}>
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                className={`button secondary small ${s.delete}`}
                disabled={!enabled || count > 0}
                title={count > 0 ? "Mova os anúncios desta categoria para outra antes de excluir" : undefined}
                onClick={() => setConfirm(true)}
              >
                <Trash2 size={14} /> Excluir
              </button>
            ))}
        </div>
      </form>
    </li>
  );
}
