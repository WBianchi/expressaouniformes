// Edições do catálogo feitas no painel (anúncios, anúncios cadastrados e categorias), lidas do
// Neon com cache. O painel invalida ao salvar. Sem DATABASE_URL (ou com erro) vale o catálogo do código.
import "server-only";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { applyCatalogEdits, NO_EDITS, type CatalogEdits, type CategoryEdits, type CreatedProducts, type ListingOverrides } from "./catalog";
import { listingOverrideSchema } from "./listing";
import { MEDIA_TAG } from "./site-media";

const categoryRow = z.object({
  slug: z.string(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  created: z.boolean(),
});
const createdRow = z.object({ slug: z.string(), name: z.string(), kind: z.enum(["stock", "custom"]), category: z.string(), published: z.boolean() });

async function rows(sql: { query: (q: string) => Promise<unknown> }, query: string) {
  // tabela ainda não criada (migração pendente): segue sem essas edições
  return ((await sql.query(query).catch(() => [])) as unknown[]) ?? [];
}

/** Todas as edições gravadas (sem cache), já validadas: linha inválida é ignorada. */
export async function listCatalogEdits(): Promise<CatalogEdits> {
  if (!process.env.DATABASE_URL) return NO_EDITS;
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  const [l, c, p] = await Promise.all([
    rows(sql, "select slug, data from expressao.product_listings"),
    rows(sql, "select slug, name, description, icon, created from expressao.category_edits order by sort, updated_at"),
    rows(sql, "select slug, name, kind, category, published from expressao.created_products order by created_at"),
  ]);
  const categories: CategoryEdits = {};
  for (const r of c) {
    const v = categoryRow.safeParse(r);
    if (v.success)
      categories[v.data.slug] = {
        ...(v.data.name ? { name: v.data.name } : {}),
        ...(v.data.description ? { description: v.data.description } : {}),
        ...(v.data.icon ? { icon: v.data.icon } : {}),
        ...(v.data.created ? { created: true } : {}),
      };
  }
  const created: CreatedProducts = {};
  for (const r of p) {
    const v = createdRow.safeParse(r);
    if (v.success) created[v.data.slug] = { name: v.data.name, kind: v.data.kind, category: v.data.category, published: v.data.published };
  }
  const listings: ListingOverrides = {};
  for (const r of l as { slug: string; data: unknown }[]) {
    const v = listingOverrideSchema.safeParse(r.data);
    if (v.success) listings[r.slug] = v.data;
    else console.error(`[anúncios] edição inválida ignorada: ${r.slug}`);
  }
  return { listings, categories, created };
}

export const getCatalogEdits = unstable_cache(
  async (): Promise<CatalogEdits> => {
    try {
      return await listCatalogEdits();
    } catch {
      return NO_EDITS;
    }
  },
  ["catalog-edits"],
  { tags: [MEDIA_TAG], revalidate: 3600 },
);

/**
 * Aplica as edições do painel ao catálogo deste processo do servidor.
 * Chamar no início de toda página, metadata, layout ou rota de API que lê produtos ou categorias.
 * `fresh`: lê direto do banco (ações do painel, que validam com o estado mais novo).
 */
export async function syncCatalog(fresh = false) {
  applyCatalogEdits(fresh ? await listCatalogEdits() : await getCatalogEdits());
}
