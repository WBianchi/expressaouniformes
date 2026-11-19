// Leitura do conteúdo editável (banners e fotos dos produtos) no Neon, com cache.
// O painel invalida o cache ao salvar. Sem DATABASE_URL usa o conteúdo padrão.
import "server-only";
import { unstable_cache } from "next/cache";
import { defaultBanners, type Banner, type PhotoOverrides } from "./banners";
import { defaultSiteContent, parseSiteContent, SITE_CONTENT_KEYS, type SiteContent } from "./site-content";

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
  image_mobile_url: string;
  active: boolean;
};

const toBanner = (r: BannerRow): Banner => ({
  id: r.id,
  title: r.title,
  subtitle: r.subtitle,
  ctaLabel: r.cta_label,
  ctaHref: r.cta_href,
  image: r.image_url,
  imageMobile: r.image_mobile_url,
  active: r.active,
});

/** Todos os banners, na ordem (painel). */
export async function listBanners(): Promise<Banner[] | null> {
  if (!process.env.DATABASE_URL) return null;
  const sql = await db();
  const rows = (await sql.query(
    "select id, title, subtitle, cta_label, cta_href, image_url, image_mobile_url, active from expressao.banners order by sort, created_at",
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
  ["home-banners-v2"],
  { tags: [MEDIA_TAG], revalidate: 3600 },
);

export async function listPhotoOverrides(): Promise<PhotoOverrides> {
  if (!process.env.DATABASE_URL) return {};
  const sql = await db();
  const rows = (await sql.query("select slug, slot, url from expressao.product_photos")) as { slug: string; slot: number; url: string }[];
  const out: PhotoOverrides = {};
  for (const r of rows) (out[r.slug] ??= [null, null, null, null, null])[r.slot] = r.url;
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

/** Foto de categoria trocada pelo painel (slug → foto e se mostra o nome sobre ela). */
export type CategoryPhotos = Record<string, { url: string; showName: boolean }>;

export async function listCategoryPhotos(): Promise<CategoryPhotos> {
  if (!process.env.DATABASE_URL) return {};
  const sql = await db();
  const rows = (await sql.query("select slug, url, show_name from expressao.category_photos")) as { slug: string; url: string; show_name: boolean }[];
  return Object.fromEntries(rows.map((r) => [r.slug, { url: r.url, showName: r.show_name }]));
}

/** Fotos de categoria trocadas pelo painel. */
export const getCategoryPhotos = unstable_cache(
  async (): Promise<CategoryPhotos> => {
    try {
      return await listCategoryPhotos();
    } catch {
      return {};
    }
  },
  ["category-photos"],
  { tags: [MEDIA_TAG], revalidate: 3600 },
);

export type ClientLogo = { id: string; name: string; image: string; active: boolean };

/** Todas as logos de clientes, na ordem (painel). */
export async function listClientLogos(): Promise<ClientLogo[] | null> {
  if (!process.env.DATABASE_URL) return null;
  const sql = await db();
  const rows = (await sql.query("select id, name, image_url, active from expressao.client_logos order by sort, created_at")) as {
    id: string;
    name: string;
    image_url: string;
    active: boolean;
  }[];
  return rows.map((r) => ({ id: r.id, name: r.name, image: r.image_url, active: r.active }));
}

/** Logos ativas para a vitrine "Empresas que confiam" (vazia = seção some). */
export const getClientLogos = unstable_cache(
  async (): Promise<ClientLogo[]> => {
    try {
      return ((await listClientLogos()) ?? []).filter((l) => l.active);
    } catch {
      return [];
    }
  },
  ["client-logos"],
  { tags: [MEDIA_TAG], revalidate: 3600 },
);

/** Barra de condições, banner da "Minha conta" e linhas das categorias, como gravados (painel). */
export async function listSiteContent(): Promise<SiteContent | null> {
  if (!process.env.DATABASE_URL) return null;
  const sql = await db();
  const rows = (await sql.query("select key, data from expressao.site_settings where key = any($1)", [[...SITE_CONTENT_KEYS]])) as {
    key: string;
    data: unknown;
  }[];
  return parseSiteContent(rows);
}

/** Conteúdo editável da loja (sem banco ou com erro: o padrão). */
export const getSiteContent = unstable_cache(
  async (): Promise<SiteContent> => {
    try {
      return (await listSiteContent()) ?? defaultSiteContent;
    } catch {
      return defaultSiteContent;
    }
  },
  ["site-content"],
  { tags: [MEDIA_TAG], revalidate: 3600 },
);
