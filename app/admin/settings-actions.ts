"use server";
// Configurações da loja gravadas pelo painel (expressao.site_settings, uma linha por chave):
// preços da personalização do simulador, barra de condições, banner da "Minha conta" e
// linhas das categorias da home.
import { feesSchema } from "@/lib/listing";
import type { CustomizationFees } from "@/lib/catalog";
import { accountBannerSchema, benefitsSchema, categoryRowsSchema, type Benefits, type CategoryRows } from "@/lib/site-content";
import { adminDb, dropBlob, runAction } from "./action-utils";

async function saveSetting(key: string, data: unknown) {
  const sql = await adminDb();
  await sql.query(
    `insert into expressao.site_settings (key, data) values ($1, $2::jsonb)
     on conflict (key) do update set data = excluded.data, updated_at = now()`,
    [key, JSON.stringify(data)],
  );
}

/** Painel → Preços do simulador: técnica × posição, que o simulador mostra e o checkout cobra. */
export async function saveCustomizationFees(input: CustomizationFees) {
  return runAction(() => saveSetting("customization_fees", feesSchema.parse(input)));
}

/** Painel → Banners: barra de condições embaixo do banner da home. */
export async function saveBenefits(input: Benefits) {
  return runAction(() => saveSetting("benefits", benefitsSchema.parse(input)));
}

/** Painel → Banners: foto do banner de "Minha conta" (vazio = volta para a padrão). */
export async function saveAccountBanner(image: string) {
  return runAction(async () => {
    const data = accountBannerSchema.parse({ image });
    const sql = await adminDb();
    const [old] = (await sql.query("select data->>'image' as image from expressao.site_settings where key = 'account_banner'")) as { image: string | null }[];
    await saveSetting("account_banner", data);
    if (old?.image && old.image !== data.image) await dropBlob(old.image);
  });
}

/** Painel → Categorias: categorias da home em 1 ou 2 linhas. */
export async function saveCategoryRows(rows: CategoryRows) {
  return runAction(() => saveSetting("category_rows", categoryRowsSchema.parse({ rows })));
}
