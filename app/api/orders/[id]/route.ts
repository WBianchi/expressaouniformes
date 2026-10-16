import { getOrderStatus } from "@/lib/order-lookup";
import { ORDER_ID_RE } from "@/lib/orders";

export const runtime = "nodejs";

const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 30;
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Status do pagamento de um pedido. Responde só status e link da fatura: nenhum dado pessoal. */
export async function GET(request: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const { id } = await ctx.params;
  if (!ORDER_ID_RE.test(id)) return json({ error: "Pedido inválido." }, 400);
  const ip = (request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (rateLimited(ip)) return json({ error: "Muitas consultas. Aguarde um minuto." }, 429);
  try {
    const status = await getOrderStatus(id);
    return status ? json(status) : json({ error: "Pedido não encontrado." }, 404);
  } catch {
    return json({ error: "Não foi possível consultar o pedido agora." }, 502);
  }
}
