// Leitura do conteúdo editável (banners e fotos dos produtos) no Neon, com cache.
// O painel invalida o cache ao salvar. Sem DATABASE_URL usa o conteúdo padrão.
import "server-only";
import { unstable_cache } from "next/cache";
import { defaultBanners, type Banner, type PhotoOverrides } from "./banners";

export const MEDIA_TAG = "site-media";

async function db() {
  const { neon } = await import("@neondatabase/serverless");
  return neon(process.env.DATABASE_URL!);
}

type BannerRow = {
  id: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  image_url: string;
  active: boolean;
};

const toBanner = (r: BannerRow): Banner => ({
  id: r.id,
  title: r.title,
  subtitle: r.subtitle,
  ctaLabel: r.cta_label,
  ctaHref: r.cta_href,
  image: r.image_url,
  active: r.active,
});

/** Todos os banners, na ordem (painel). */
export async function listBanners(): Promise<Banner[] | null> {
  if (!process.env.DATABASE_URL) return null;
  const sql = await db();
  const rows = (await sql.query(
    "select id, title, subtitle, cta_label, cta_href, image_url, active from expressao.banners order by sort, created_at",
  )) as BannerRow[];
  return rows.map(toBanner);
}

/** Banners ativos para a home. */
export const getBanners = unstable_cache(
  async (): Promise<Banner[]> => {
    try {
      const all = await listBanners();
      const active = all?.filter((b) => b.active);
      return active?.length ? active : defaultBanners;
    } catch {
      return defaultBanners;
    }
  },
  ["home-banners"],
  { tags: [MEDIA_TAG], revalidate: 3600 },
);

export async function listPhotoOverrides(): Promise<PhotoOverrides> {
  if (!process.env.DATABASE_URL) return {};
  const sql = await db();
  const rows = (await sql.query("select slug, slot, url from expressao.product_photos")) as { slug: string; slot: number; url: string }[];
  const out: PhotoOverrides = {};
  for (const r of rows) (out[r.slug] ??= [null, null])[r.slot] = r.url;
  return out;
}

/** Fotos de vitrine trocadas pelo painel. */
export const getPhotoOverrides = unstable_cache(
  async (): Promise<PhotoOverrides> => {
    try {
      return await listPhotoOverrides();
    } catch {
      return {};
    }
  },
  ["product-photos"],
  { tags: [MEDIA_TAG], revalidate: 3600 },
);
