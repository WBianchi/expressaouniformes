"use server";
// Edição de banners da home e fotos dos produtos (vitrine e peça sozinha) pelo painel.
import { z } from "zod";
import { safeHref, safeImage } from "@/lib/banners";
import { catalogHas, getCategory } from "@/lib/catalog";
import { adminCatalog, adminDb as db, dropBlob, runAction as run, type MediaResult } from "./action-utils";

export type { MediaResult };

const bannerSchema = z.object({
  id: z.string().uuid().optional(),
  // opcional: banner só com a imagem (arte que já traz o texto)
  title: z.string().trim().max(90, "Título muito longo (máx. 90)."),
  subtitle: z.string().trim().max(180, "Texto muito longo (máx. 180)."),
  ctaLabel: z.string().trim().max(32, "Texto do botão muito longo (máx. 32)."),
  ctaHref: z.string().trim().max(300),
  image: z.string().trim().refine(safeImage, "Envie a imagem do banner."),
  imageMobile: z.string().trim().refine((u) => !u || safeImage(u), "Imagem de celular inválida."),
  active: z.boolean(),
});

export async function saveBanner(input: z.input<typeof bannerSchema>) {
  return run(async () => {
    const sql = await db();
    const b = bannerSchema.parse(input);
    const href = b.ctaHref ? safeHref(b.ctaHref) : "";
    if (b.id) {
      const [old] = (await sql.query("select image_url, image_mobile_url from expressao.banners where id = $1", [b.id])) as {
        image_url: string;
        image_mobile_url: string;
      }[];
      await sql.query(
        "update expressao.banners set title=$2, subtitle=$3, cta_label=$4, cta_href=$5, image_url=$6, image_mobile_url=$7, active=$8, updated_at=now() where id=$1",
        [b.id, b.title, b.subtitle, b.ctaLabel, href, b.image, b.imageMobile, b.active],
      );
      if (old && old.image_url !== b.image) await dropBlob(old.image_url);
      if (old && old.image_mobile_url !== b.imageMobile) await dropBlob(old.image_mobile_url);
    } else {
      await sql.query(
        "insert into expressao.banners (title, subtitle, cta_label, cta_href, image_url, image_mobile_url, active, sort) values ($1,$2,$3,$4,$5,$6,$7, coalesce((select max(sort) from expressao.banners), 0) + 1)",
        [b.title, b.subtitle, b.ctaLabel, href, b.image, b.imageMobile, b.active],
      );
    }
  });
}

export async function deleteBanner(id: string) {
  return run(async () => {
    const sql = await db();
    const rows = (await sql.query("delete from expressao.banners where id = $1 returning image_url, image_mobile_url", [z.string().uuid().parse(id)])) as {
      image_url: string;
      image_mobile_url: string;
    }[];
    await dropBlob(rows[0]?.image_url);
    await dropBlob(rows[0]?.image_mobile_url);
  });
}

/** Grava a nova ordem (lista completa de ids). */
export async function reorderBanners(ids: string[]) {
  return run(async () => {
    const sql = await db();
    const list = z.array(z.string().uuid()).max(50).parse(ids);
    await sql.transaction(list.map((id, i) => sql.query("update expressao.banners set sort = $2 where id = $1", [id, i + 1])));
  });
}

const slotSchema = z.object({
  slug: z.string().refine((s) => catalogHas(s), "Produto inválido."),
  // 0–1 pessoa vestindo; 2–4 peça sozinha (frente, costas, lado), ver lib/product-media.ts
  slot: z.number().int().min(0, "Foto inválida.").max(4, "Foto inválida."),
});

export async function setProductPhoto(slug: string, slot: number, url: string) {
  return run(async () => {
    const sql = await adminCatalog();
    const k = slotSchema.parse({ slug, slot });
    if (!safeImage(url)) throw new Error("Envie uma imagem.");
    const [old] = (await sql.query("select url from expressao.product_photos where slug=$1 and slot=$2", [k.slug, k.slot])) as { url: string }[];
    await sql.query(
      "insert into expressao.product_photos (slug, slot, url) values ($1,$2,$3) on conflict (slug, slot) do update set url = excluded.url, updated_at = now()",
      [k.slug, k.slot, url],
    );
    if (old && old.url !== url) await dropBlob(old.url);
  });
}

export async function resetProductPhoto(slug: string, slot: number) {
  return run(async () => {
    const sql = await adminCatalog();
    const k = slotSchema.parse({ slug, slot });
    const rows = (await sql.query("delete from expressao.product_photos where slug=$1 and slot=$2 returning url", [k.slug, k.slot])) as { url: string }[];
    await dropBlob(rows[0]?.url);
  });
}

/* ---------------- Fotos das categorias (home e menu) ---------------- */

const categorySlug = z.string().refine((s) => !!getCategory(s), "Categoria inválida.");

export async function setCategoryPhoto(slug: string, url: string) {
  return run(async () => {
    const sql = await adminCatalog();
    const k = categorySlug.parse(slug);
    if (!safeImage(url)) throw new Error("Envie uma imagem.");
    const [old] = (await sql.query("select url from expressao.category_photos where slug=$1", [k])) as { url: string }[];
    await sql.query(
      "insert into expressao.category_photos (slug, url) values ($1,$2) on conflict (slug) do update set url = excluded.url, updated_at = now()",
      [k, url],
    );
    if (old && old.url !== url) await dropBlob(old.url);
  });
}

export async function setCategoryShowName(slug: string, show: boolean) {
  return run(async () => {
    const sql = await adminCatalog();
    await sql.query("update expressao.category_photos set show_name=$2, updated_at=now() where slug=$1", [categorySlug.parse(slug), !!show]);
  });
}

export async function resetCategoryPhoto(slug: string) {
  return run(async () => {
    const sql = await adminCatalog();
    const rows = (await sql.query("delete from expressao.category_photos where slug=$1 returning url", [categorySlug.parse(slug)])) as { url: string }[];
    await dropBlob(rows[0]?.url);
  });
}

/* ---------------- Logos de clientes (galeria "Nossos clientes") ---------------- */

const clientLogoSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da empresa.").max(80),
  image: z.string().trim().refine(safeImage, "Envie a logo."),
});

export async function addClientLogo(input: z.input<typeof clientLogoSchema>) {
  return run(async () => {
    const sql = await db();
    const l = clientLogoSchema.parse(input);
    await sql.query(
      "insert into expressao.client_logos (name, image_url, sort) values ($1, $2, coalesce((select max(sort) from expressao.client_logos), 0) + 1)",
      [l.name, l.image],
    );
  });
}

export async function toggleClientLogo(id: string, active: boolean) {
  return run(async () => {
    const sql = await db();
    await sql.query("update expressao.client_logos set active = $2 where id = $1", [z.string().uuid().parse(id), active]);
  });
}

export async function deleteClientLogo(id: string) {
  return run(async () => {
    const sql = await db();
    const rows = (await sql.query("delete from expressao.client_logos where id = $1 returning image_url", [z.string().uuid().parse(id)])) as {
      image_url: string;
    }[];
    await dropBlob(rows[0]?.image_url);
  });
}

export async function reorderClientLogos(ids: string[]) {
  return run(async () => {
    const sql = await db();
    const list = z.array(z.string().uuid()).max(200).parse(ids);
    await sql.transaction(list.map((id, i) => sql.query("update expressao.client_logos set sort = $2 where id = $1", [id, i + 1])));
  });
}
