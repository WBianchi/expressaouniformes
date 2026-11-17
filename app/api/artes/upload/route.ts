// Upload do arquivo original da logo do cliente, direto do navegador para o Vercel Blob.
// O site guarda só a miniatura no carrinho; o original vai para o pedido e para a fila de
// artes do painel (Personalizações), para a fábrica imprimir ou bordar com qualidade.
// Público (o cliente não tem login): só imagens de logo, até 10 MB, do próprio site e com limite por IP.
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { ART_MAX_BYTES, ART_TYPES } from "@/lib/art";

export const runtime = "nodejs";

const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 20;
}

/** Só pedidos de token vindos do próprio site. */
function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const host = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || req.headers.get("host") || new URL(req.url).host;
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "Envio de arquivos indisponível." }, { status: 503 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  const ip = (request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (rateLimited(ip)) return NextResponse.json({ error: "Muitos envios. Aguarde alguns minutos." }, { status: 429 });
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  if (body.type !== "blob.generate-client-token") return NextResponse.json({ error: "Operação inválida." }, { status: 400 });
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^artes\/[a-z0-9.-]{1,80}$/.test(pathname)) throw new Error("Destino inválido.");
        return {
          allowedContentTypes: [...ART_TYPES],
          maximumSizeInBytes: ART_MAX_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + 10 * 60_000,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
        };
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Falha no envio." }, { status: 400 });
  }
}
