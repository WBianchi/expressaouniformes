"use server";
// Painel → Categorias: renomear, descrever, criar e excluir categorias. O endereço (slug) de uma
// categoria nunca muda, então os produtos ligados a ela continuam ligados depois de renomear.
import { z } from "zod";
import { categories, getCategory, products } from "@/lib/catalog";
import { categoryIcons } from "@/lib/category-icons";
import { adminCatalog, dropBlob, runAction, type MediaResult } from "./action-utils";

const fields = z.object({
  name: z.string().trim().min(2, "Informe o nome da categoria.").max(40, "Nome muito longo (máx. 40)."),
  description: z.string().trim().max(160, "Descrição muito longa (máx. 160)."),
  icon: z.enum(categoryIcons),
});
export type CategoryInput = z.input<typeof fields>;

/** Salva nome, descrição e ícone de uma categoria (do catálogo ou criada no painel). */
export async function saveCategory(slug: string, input: CategoryInput) {
  return runAction(async () => {
    const sql = await adminCatalog();
    const c = getCategory(slug);
    if (!c) throw new Error("Categoria inválida.");
    const v = fields.parse(input);
    if (categories.some((x) => x.slug !== slug && x.name.toLowerCase() === v.name.toLowerCase())) throw new Error("Já existe uma categoria com esse nome.");
    await sql.query(
      `insert into expressao.category_edits (slug, name, description, icon, created) values ($1, $2, $3, $4, $5)
       on conflict (slug) do update set name = excluded.name, description = excluded.description, icon = excluded.icon, updated_at = now()`,
      [slug, v.name, v.description, v.icon, !!c.created],
    );
  });
}

const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "categoria";

/** Cria uma categoria nova (entra no fim da lista). */
export async function createCategory(input: CategoryInput): Promise<MediaResult & { slug?: string }> {
  let slug = "";
  const r = await runAction(async () => {
    const sql = await adminCatalog();
    const v = fields.parse(input);
    if (categories.some((x) => x.name.toLowerCase() === v.name.toLowerCase())) throw new Error("Já existe uma categoria com esse nome.");
    const base = slugify(v.name);
    slug = base;
    for (let n = 2; getCategory(slug); n++) slug = `${base}-${n}`;
    await sql.query(
      `insert into expressao.category_edits (slug, name, description, icon, created, sort)
       values ($1, $2, $3, $4, true, coalesce((select max(sort) from expressao.category_edits), 0) + 1)`,
      [slug, v.name, v.description, v.icon],
    );
  });
  return r.ok ? { ...r, slug } : r;
}

/** Exclui uma categoria criada no painel, se nenhum anúncio estiver nela. */
export async function deleteCategory(slug: string) {
  return runAction(async () => {
    const sql = await adminCatalog();
    const c = getCategory(slug);
    if (!c?.created) throw new Error("Só categorias criadas no painel podem ser excluídas.");
    // anúncios da loja (já com as edições) e rascunhos cadastrados no painel
    const drafts = (await sql.query(
      `select c.slug from expressao.created_products c
         left join expressao.product_listings l on l.slug = c.slug
        where coalesce(l.data->>'category', c.category) = $1`,
      [slug],
    )) as { slug: string }[];
    if (products.some((p) => p.category === slug) || drafts.length) throw new Error("Mova os anúncios desta categoria para outra antes de excluir.");
    await sql.query("delete from expressao.category_edits where slug = $1", [slug]);
    const photo = (await sql.query("delete from expressao.category_photos where slug = $1 returning url", [slug])) as { url: string }[];
    await dropBlob(photo[0]?.url);
  });
}
