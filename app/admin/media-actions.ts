"use server";
// Edição de banners da home e fotos de vitrine dos produtos pelo painel.
import { del } from "@vercel/blob";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { safeHref, safeImage } from "@/lib/banners";
import { getProduct } from "@/lib/catalog";
import { MEDIA_TAG } from "@/lib/site-media";

export type MediaResult = { ok: true } | { ok: false; error: string };

async function db() {
  if (!(await isAdmin())) throw new Error("Sessão expirada. Entre no painel novamente.");
  if (!process.env.DATABASE_URL) throw new Error("Banco de dados não configurado.");
  const { neon } = await import("@neondatabase/serverless");
  return neon(process.env.DATABASE_URL);
}

function refresh() {
  updateTag(MEDIA_TAG);
  revalidatePath("/", "layout");
}

/** Apaga do Blob imagens enviadas pelo painel que não são mais usadas. */
async function dropBlob(url: string | undefined) {
  if (url && /\.public\.blob\.vercel-storage\.com\//.test(url)) await del(url).catch(() => {});
}

async function run(fn: () => Promise<void>): Promise<MediaResult> {
  try {
    await fn();
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof z.ZodError ? (e.issues[0]?.message ?? "Dados inválidos.") : e instanceof Error ? e.message : "Erro ao salvar." };
  }
}

const bannerSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3, "Informe o título.").max(90, "Título muito longo (máx. 90)."),
  subtitle: z.string().trim().max(180, "Texto muito longo (máx. 180)."),
  ctaLabel: z.string().trim().max(32, "Texto do botão muito longo (máx. 32)."),
  ctaHref: z.string().trim().max(300),
  image: z.string().trim().refine(safeImage, "Envie uma imagem."),
  active: z.boolean(),
});

export async function saveBanner(input: z.input<typeof bannerSchema>) {
  return run(async () => {
    const sql = await db();
    const b = bannerSchema.parse(input);
    const href = b.ctaHref ? safeHref(b.ctaHref) : "";
    if (b.id) {
      const [old] = (await sql.query("select image_url from expressao.banners where id = $1", [b.id])) as { image_url: string }[];
      await sql.query(
        "update expressao.banners set title=$2, subtitle=$3, cta_label=$4, cta_href=$5, image_url=$6, active=$7, updated_at=now() where id=$1",
        [b.id, b.title, b.subtitle, b.ctaLabel, href, b.image, b.active],
      );
      if (old && old.image_url !== b.image) await dropBlob(old.image_url);
    } else {
      await sql.query(
        "insert into expressao.banners (title, subtitle, cta_label, cta_href, image_url, active, sort) values ($1,$2,$3,$4,$5,$6, coalesce((select max(sort) from expressao.banners), 0) + 1)",
        [b.title, b.subtitle, b.ctaLabel, href, b.image, b.active],
      );
    }
  });
}

export async function deleteBanner(id: string) {
  return run(async () => {
    const sql = await db();
    const rows = (await sql.query("delete from expressao.banners where id = $1 returning image_url", [z.string().uuid().parse(id)])) as { image_url: string }[];
    await dropBlob(rows[0]?.image_url);
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
  slug: z.string().refine((s) => !!getProduct(s), "Produto inválido."),
  slot: z.union([z.literal(0), z.literal(1)]),
});

export async function setProductPhoto(slug: string, slot: number, url: string) {
  return run(async () => {
    const sql = await db();
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
    const sql = await db();
    const k = slotSchema.parse({ slug, slot });
    const rows = (await sql.query("delete from expressao.product_photos where slug=$1 and slot=$2 returning url", [k.slug, k.slot])) as { url: string }[];
    await dropBlob(rows[0]?.url);
  });
}
