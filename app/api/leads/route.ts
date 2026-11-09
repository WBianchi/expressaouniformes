// Contato deixado no questionário de qualificação. Serve para recuperar quem começou
// e não finalizou (painel → Leads). Sem banco, responde ok e não grava.
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/lead";

// limite simples por IP (por instância)
const hits = new Map<string, number[]>();

export async function POST(request: Request) {
  const h = await headers();
  const ip = (h.get("x-vercel-forwarded-for") || h.get("x-forwarded-for") || "local").split(",")[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (recent.length >= 10) return NextResponse.json({ error: "Muitas tentativas. Tente de novo em alguns minutos." }, { status: 429 });
  hits.set(ip, [...recent, now]);

  const parsed = leadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  const l = parsed.data;
  if (l.website) return NextResponse.json({ ok: true }); // armadilha para robôs

  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: true, stored: false });
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    const rows = (await sql.query(
      `insert into expressao.leads (name, phone, email, company, product, qty, route, custom, technique, fabric, source)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id`,
      [l.name, l.phone, l.email, l.company, l.product, l.qty, l.route, l.custom, l.technique, l.fabric, l.source],
    )) as { id: string }[];
    return NextResponse.json({ ok: true, id: rows[0]?.id });
  } catch {
    return NextResponse.json({ ok: true, stored: false });
  }
}
