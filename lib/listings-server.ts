// Edições de anúncios (painel → Anúncios) lidas do Neon, com cache. O painel invalida ao salvar.
// Sem DATABASE_URL (ou com erro) o catálogo fica como está no código.
import "server-only";
import { unstable_cache } from "next/cache";
import { applyListings, getProduct, type ListingOverrides } from "./catalog";
import { listingOverrideSchema } from "./listing";
import { MEDIA_TAG } from "./site-media";

/** Edições gravadas (sem cache), já validadas: linha inválida é ignorada. */
export async function listListings(): Promise<ListingOverrides> {
  if (!process.env.DATABASE_URL) return {};
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  const rows = (await sql.query("select slug, data from expressao.product_listings")) as { slug: string; data: unknown }[];
  const out: ListingOverrides = {};
  for (const r of rows) {
    if (!getProduct(r.slug)) continue;
    const parsed = listingOverrideSchema.safeParse(r.data);
    if (parsed.success) out[r.slug] = parsed.data;
    else console.error(`[anúncios] edição inválida ignorada: ${r.slug}`);
  }
  return out;
}

export const getListings = unstable_cache(
  async (): Promise<ListingOverrides> => {
    try {
      return await listListings();
    } catch {
      return {};
    }
  },
  ["product-listings"],
  { tags: [MEDIA_TAG], revalidate: 3600 },
);

/**
 * Aplica as edições do painel ao catálogo deste processo do servidor.
 * Chamar no início de toda página, metadata ou rota de API que lê produtos (nome, preço, cores, tamanhos).
 */
export async function syncCatalog() {
  applyListings(await getListings());
}
