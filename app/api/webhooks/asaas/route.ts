import { createHash, timingSafeEqual } from "node:crypto";
import { applyPaymentEvent, paymentStatusFromEvent } from "@/lib/orders";

export const runtime = "nodejs";

const ok = (extra: Record<string, unknown> = {}) => Response.json({ received: true, ...extra }, { status: 200 });

/** Comparação em tempo constante (hash para igualar tamanhos). */
function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

type AsaasWebhook = {
  id?: string;
  event?: string;
  payment?: { id?: string; externalReference?: string | null; status?: string };
};

export async function POST(request: Request) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected) return Response.json({ error: "Webhook não configurado." }, { status: 503 });
  const token = request.headers.get("asaas-access-token") ?? "";
  if (!token || !safeEqual(token, expected)) return Response.json({ error: "Não autorizado." }, { status: 401 });

  let body: AsaasWebhook;
  try {
    const raw = await request.text();
    if (raw.length > 200_000) return Response.json({ error: "Payload muito grande." }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const event = typeof body.event === "string" ? body.event : "";
  const paymentId = body.payment?.id;
  // eventos que não são de cobrança (ou desconhecidos) são confirmados e ignorados
  const status = paymentStatusFromEvent(event);
  if (!status || typeof paymentId !== "string") return ok({ ignored: true });

  const eventId = typeof body.id === "string" && body.id ? body.id : `${event}:${paymentId}`;
  try {
    const result = await applyPaymentEvent({
      eventId,
      event,
      paymentId,
      externalReference: body.payment?.externalReference,
      status,
    });
    return ok({ result });
  } catch {
    console.error(`[webhook asaas] falha ao aplicar evento ${event}`);
    // 5xx faz o Asaas reenviar o evento depois
    return Response.json({ error: "Falha temporária." }, { status: 500 });
  }
}
