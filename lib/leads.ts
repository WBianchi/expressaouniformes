// Leitura dos contatos do questionário para o painel (server-only).
import "server-only";
import type { AdminLead } from "./lead-admin-types";

export async function listLeads(limit = 300): Promise<AdminLead[] | null> {
  if (!process.env.DATABASE_URL) return null;
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  const rows = (await sql.query(
    `select id, name, phone, email, company, product, qty, route, custom, technique, fabric, source, status, created_at
     from expressao.leads order by created_at desc limit $1`,
    [limit],
  )) as (Omit<AdminLead, "createdAt"> & { created_at: string | Date })[];
  return rows.map(({ created_at, ...r }) => ({ ...r, createdAt: new Date(created_at).toISOString() }));
}
