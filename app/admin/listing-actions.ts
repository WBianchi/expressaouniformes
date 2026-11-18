"use server";
// Painel → Anúncios: grava as edições do anúncio (texto, ficha técnica, preço, cores, tamanhos,
// categoria), a galeria de fotos, as fotos vestindo por cor e os anúncios cadastrados no painel.
// Só o que difere do catálogo do código vai para o banco.
import { z } from "zod";
import { safeImage } from "@/lib/banners";
import { catalogHas, colors, getCategory, NO_PHOTO, withListing, type ListingFields, type SaleKind } from "@/lib/catalog";
import { cleanColorPhotos, COLOR_PHOTO_SLOTS, galleryPhotosSchema, listingDiff, listingFieldsOf, listingFormSchema, listingOverrideSchema, type ListingForm } from "@/lib/listing";
import { adminCatalog, dropBlob, runAction, type MediaResult } from "./action-utils";

type Sql = Awaited<ReturnType<typeof adminCatalog>>;

const slugSchema = z.string().refine((s) => catalogHas(s), "Produto inválido.");

async function readOverride(sql: Sql, slug: string): Promise<Partial<ListingFields>> {
  const [row] = (await sql.query("select data from expressao.product_listings where slug = $1", [slug])) as { data: unknown }[];
  const parsed = listingOverrideSchema.safeParse(row?.data ?? {});
  return parsed.success ? parsed.data : {};
}

async function writeOverride(sql: Sql, slug: string, data: Partial<ListingFields>) {
  if (!Object.keys(data).length) await sql.query("delete from expressao.product_listings where slug = $1", [slug]);
  else
    await sql.query(
      "insert into expressao.product_listings (slug, data) values ($1, $2::jsonb) on conflict (slug) do update set data = excluded.data, updated_at = now()",
      [slug, JSON.stringify(data)],
    );
}

/** Salva o formulário "Editar anúncio". */
export async function saveListing(slug: string, input: ListingForm) {
  return runAction(async () => {
    const sql = await adminCatalog();
    const k = slugSchema.parse(slug);
    const form = listingFormSchema.parse(input);
    const catalog = withListing(k, undefined)!;
    const base = listingFieldsOf(catalog);
    let fields: Partial<ListingFields> = form;
    if (catalog.kind === "stock") {
      if (form.price < 0.01) throw new Error("Informe o preço de venda.");
      if (!form.sizes.length) throw new Error("Escolha ao menos um tamanho à venda.");
    } else {
      // fabricação é sob orçamento: sem preço nem grade de compra no site
      fields = { ...form, price: base.price, compareAt: base.compareAt, sizes: base.sizes };
    }
    const old = await readOverride(sql, k);
    const next = listingDiff(base, fields);
    // a galeria e as fotos por cor têm botões próprios e continuam como estão
    if (old.photos) next.photos = old.photos;
    if (old.colorPhotos) next.colorPhotos = old.colorPhotos;
    await writeOverride(sql, k, next);
  });
}

/** Volta título, descrição, ficha, preço, cores, tamanhos e categoria para o original (as fotos ficam). */
export async function resetListing(slug: string) {
  return runAction(async () => {
    const sql = await adminCatalog();
    const k = slugSchema.parse(slug);
    const old = await readOverride(sql, k);
    await writeOverride(sql, k, { ...(old.photos ? { photos: old.photos } : {}), ...(old.colorPhotos ? { colorPhotos: old.colorPhotos } : {}) });
  });
}

/**
 * Salva a galeria do anúncio: as fotos na ordem escolhida (a primeira é a capa).
 * As fotos que saíram da galeria são apagadas do Blob.
 */
export async function saveGallery(slug: string, photos: string[]) {
  return runAction(async () => {
    const sql = await adminCatalog();
    const k = slugSchema.parse(slug);
    const list = galleryPhotosSchema.parse(photos);
    const base = withListing(k, undefined)!;
    const old = await readOverride(sql, k);
    // as fotos antigas de vitrine (posições 1 e 2) passam a fazer parte da galeria
    const slots = (await sql.query("delete from expressao.product_photos where slug = $1 and slot in (0, 1) returning url", [k])) as { url: string }[];
    const before = [...(old.photos ?? []), ...slots.map((r) => r.url)];
    const next = { ...old };
    if (JSON.stringify(list) === JSON.stringify(base.photos)) delete next.photos;
    else next.photos = list;
    await writeOverride(sql, k, next);
    for (const url of new Set(before)) if (!list.includes(url)) await dropBlob(url);
  });
}

const colorPhotoSchema = z.object({
  slug: slugSchema,
  color: z.string().refine((c) => colors.some((x) => x.id === c), "Cor inválida."),
  index: z.number().int().min(0).max(COLOR_PHOTO_SLOTS - 1),
  url: z.string().refine(safeImage, "Envie uma imagem.").nullable(),
});

/** Troca (url) ou remove (null) uma foto própria de uma cor: 0–1 pessoa vestindo, 2–4 peça (frente, costas, lado). */
export async function setColorPhoto(slug: string, color: string, index: number, url: string | null) {
  return runAction(async () => {
    const sql = await adminCatalog();
    const k = colorPhotoSchema.parse({ slug, color, index, url });
    const old = await readOverride(sql, k.slug);
    const map = { ...(old.colorPhotos ?? {}) };
    const list = Array.from({ length: COLOR_PHOTO_SLOTS }, (_, i) => map[k.color]?.[i] ?? "");
    const prev = list[k.index];
    list[k.index] = k.url ?? "";
    map[k.color] = list;
    const photos = cleanColorPhotos(map);
    const next = { ...old };
    if (Object.keys(photos).length) next.colorPhotos = photos;
    else delete next.colorPhotos;
    // valida o conjunto (cor da paleta, imagens do site/Blob) antes de gravar
    listingOverrideSchema.parse(next);
    await writeOverride(sql, k.slug, next);
    if (prev && prev !== k.url) await dropBlob(prev);
  });
}

/* ---------------- anúncios cadastrados no painel ---------------- */

const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "produto";

const newProductSchema = z.object({
  name: z.string().trim().min(3, "Informe o título do anúncio.").max(90, "Título muito longo (máx. 90)."),
  kind: z.enum(["stock", "custom"]),
  category: z.string().refine((c) => !!getCategory(c), "Escolha a categoria."),
});

/** Cadastra um anúncio novo (rascunho, fora da loja até publicar). Devolve o endereço criado. */
export async function createProduct(input: { name: string; kind: SaleKind; category: string }): Promise<MediaResult & { slug?: string }> {
  let slug = "";
  const r = await runAction(async () => {
    const sql = await adminCatalog();
    const p = newProductSchema.parse(input);
    const base = slugify(p.name);
    slug = base;
    for (let n = 2; catalogHas(slug); n++) slug = `${base}-${n}`;
    await sql.query("insert into expressao.created_products (slug, name, kind, category) values ($1, $2, $3, $4)", [slug, p.name, p.kind, p.category]);
  });
  return r.ok ? { ...r, slug } : r;
}

/** Publica (aparece na loja) ou volta para rascunho um anúncio cadastrado no painel. */
export async function setPublished(slug: string, published: boolean) {
  return runAction(async () => {
    const sql = await adminCatalog();
    const k = slugSchema.parse(slug);
    const [row] = (await sql.query("select slug from expressao.created_products where slug = $1", [k])) as { slug: string }[];
    if (!row) throw new Error("Só anúncios cadastrados no painel podem ser publicados ou despublicados.");
    if (published) {
      const p = withListing(k, await readOverride(sql, k))!;
      if (p.photos.every((src) => src === NO_PHOTO)) throw new Error("Envie ao menos uma foto (a capa) antes de publicar.");
      if (p.description.trim().length < 10) throw new Error("Escreva a descrição e salve o anúncio antes de publicar.");
      if (p.kind === "stock" && p.price < 0.01) throw new Error("Informe o preço e salve o anúncio antes de publicar.");
    }
    await sql.query("update expressao.created_products set published = $2 where slug = $1", [k, published]);
  });
}

/** Exclui um anúncio cadastrado no painel (os do catálogo original não podem ser excluídos). */
export async function deleteProduct(slug: string) {
  return runAction(async () => {
    const sql = await adminCatalog();
    const k = slugSchema.parse(slug);
    const rows = (await sql.query("delete from expressao.created_products where slug = $1 returning slug", [k])) as { slug: string }[];
    if (!rows.length) throw new Error("Só anúncios cadastrados no painel podem ser excluídos.");
    const old = await readOverride(sql, k);
    const photos = (await sql.query("delete from expressao.product_photos where slug = $1 returning url", [k])) as { url: string }[];
    await sql.query("delete from expressao.product_listings where slug = $1", [k]);
    for (const url of [...(old.photos ?? []), ...Object.values(old.colorPhotos ?? {}).flat(), ...photos.map((r) => r.url)]) await dropBlob(url);
  });
}
