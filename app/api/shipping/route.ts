import { z } from "zod";
import { quoteFreight } from "@/lib/frenet";
import { cartLineSchema } from "@/lib/validation";
import type { CartLine } from "@/lib/pricing";

export const runtime = "nodejs";

const bodySchema = z.object({
  cep: z.string().refine((v) => v.replace(/\D/g, "").length === 8, "CEP inválido"),
  // a logo não interfere no frete: o navegador envia as linhas sem ela
  lines: z.array(cartLineSchema).min(1).max(30),
});

const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 40;
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const ip = (request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (rateLimited(ip)) return json({ error: "Muitas consultas de frete. Aguarde um minuto." }, 429);

  let parsed;
  try {
    const raw = await request.text();
    if (raw.length > 200_000) return json({ error: "Requisição muito grande." }, 413);
    parsed = bodySchema.safeParse(JSON.parse(raw));
  } catch {
    return json({ error: "Dados inválidos." }, 400);
  }
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, 422);

  const result = await quoteFreight(parsed.data.cep, parsed.data.lines as CartLine[]);
  return json(result);
}
