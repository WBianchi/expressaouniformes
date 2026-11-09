"use server";
// Contatos do questionário (recuperação de quem não finalizou): só muda o status.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/lead-admin-types";

export async function setLeadStatus(id: string, status: LeadStatus): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!(await isAdmin())) throw new Error("Sessão expirada. Entre no painel novamente.");
    if (!process.env.DATABASE_URL) throw new Error("Banco de dados não configurado.");
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    await sql.query("update expressao.leads set status = $2, updated_at = now() where id = $1", [
      z.string().uuid().parse(id),
      z.enum(LEAD_STATUSES).parse(status),
    ]);
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar." };
  }
}
