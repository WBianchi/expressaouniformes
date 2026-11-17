"use server";
// Painel → Preços do simulador: tabela de preços da personalização (técnica × posição) que o
// simulador mostra e o checkout cobra em todas as peças de pronta-entrega.
import { feesSchema } from "@/lib/listing";
import type { CustomizationFees } from "@/lib/catalog";
import { adminDb, runAction } from "./action-utils";

export async function saveCustomizationFees(input: CustomizationFees) {
  return runAction(async () => {
    const sql = await adminDb();
    const fees = feesSchema.parse(input);
    await sql.query(
      `insert into expressao.site_settings (key, data) values ('customization_fees', $1::jsonb)
       on conflict (key) do update set data = excluded.data, updated_at = now()`,
      [JSON.stringify(fees)],
    );
  });
}
