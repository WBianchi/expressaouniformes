"use server";
// Painel → Personalizações: aprovar a arte do pedido ou pedir ajuste ao cliente.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { artStatuses, type ArtStatus } from "@/lib/art";
import { ORDER_ID_RE } from "@/lib/orders";
import { adminDb, runAction } from "./action-utils";

const reviewSchema = z
  .object({
    orderId: z.string().regex(ORDER_ID_RE, "Pedido inválido."),
    status: z.enum(artStatuses),
    note: z.string().trim().max(1000, "Mensagem muito longa (máx. 1000).").optional(),
  })
  .refine((r) => r.status !== "ajuste" || !!r.note, { message: "Escreva o que precisa ser ajustado na arte.", path: ["note"] });

/** Muda a situação da arte do pedido (aprovada segue para a produção). */
export async function setArtStatus(orderId: string, status: ArtStatus, note?: string) {
  return runAction(
    async () => {
      const sql = await adminDb();
      const r = reviewSchema.parse({ orderId, status, note: note || undefined });
      const rows = (await sql.query(
        `insert into expressao.art_reviews (order_id, status, note)
         select $1, $2, $3 where exists (select 1 from expressao.shop_orders where id = $1)
         on conflict (order_id) do update set status = excluded.status, note = excluded.note, updated_at = now()
         returning order_id`,
        [r.orderId, r.status, r.status === "ajuste" ? r.note : null],
      )) as { order_id: string }[];
      if (!rows.length) throw new Error("Pedido não encontrado no banco.");
    },
    () => revalidatePath("/admin"),
  );
}
