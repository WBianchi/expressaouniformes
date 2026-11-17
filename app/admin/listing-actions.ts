"use server";
// Painel → Anúncios: grava as edições do anúncio (texto, ficha técnica, preço, cores, tamanhos)
// e as fotos de pessoa vestindo por cor. Só o que difere do catálogo do código vai para o banco.
import { z } from "zod";
import { safeImage } from "@/lib/banners";
import { colors, getProduct, withListing, type ListingFields } from "@/lib/catalog";
import { cleanColorPhotos, listingDiff, listingFieldsOf, listingFormSchema, listingOverrideSchema, type ListingForm } from "@/lib/listing";
import { adminDb, dropBlob, runAction } from "./action-utils";

type Sql = Awaited<ReturnType<typeof adminDb>>;

const slugSchema = z.string().refine((s) => !!getProduct(s), "Produto inválido.");

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
    const sql = await adminDb();
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
    // as fotos por cor são gravadas a cada envio (setColorPhoto) e continuam como estão
    if (old.colorPhotos) next.colorPhotos = old.colorPhotos;
    await writeOverride(sql, k, next);
  });
}

/** Volta título, descrição, ficha, preço, cores e tamanhos para o catálogo (as fotos ficam). */
export async function resetListing(slug: string) {
  return runAction(async () => {
    const sql = await adminDb();
    const k = slugSchema.parse(slug);
    const old = await readOverride(sql, k);
    await writeOverride(sql, k, old.colorPhotos ? { colorPhotos: old.colorPhotos } : {});
  });
}

const colorPhotoSchema = z.object({
  slug: slugSchema,
  color: z.string().refine((c) => colors.some((x) => x.id === c), "Cor inválida."),
  index: z.union([z.literal(0), z.literal(1)]),
  url: z.string().refine(safeImage, "Envie uma imagem.").nullable(),
});

/** Troca (url) ou remove (null) a foto de pessoa vestindo de uma cor: 0 = frente, 1 = costas. */
export async function setColorPhoto(slug: string, color: string, index: number, url: string | null) {
  return runAction(async () => {
    const sql = await adminDb();
    const k = colorPhotoSchema.parse({ slug, color, index, url });
    const old = await readOverride(sql, k.slug);
    const map = { ...(old.colorPhotos ?? {}) };
    const list = [...(map[k.color] ?? ["", ""])];
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
