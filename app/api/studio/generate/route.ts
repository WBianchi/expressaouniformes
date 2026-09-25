import { neon } from "@neondatabase/serverless";
import { createHash } from "node:crypto";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 180;
const input = z.object({ prompt: z.string().trim().min(8).max(800) });
const fail = (error: string, status: number) =>
  Response.json({ error }, { status });

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return fail("Origem inválida.", 403);
  if (
    process.env.AI_IMAGE_GENERATION_ENABLED !== "true" ||
    !process.env.OPENAI_API_KEY ||
    !process.env.DATABASE_URL
  )
    return fail(
      "A geração com IA ainda não foi ativada pela loja. Você pode enviar uma logo ou adicionar texto.",
      503,
    );
  if (Number(request.headers.get("content-length")) > 4096)
    return fail("Descrição muito longa.", 413);
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return fail("Descrição muito longa.", 413);
    body = input.safeParse(JSON.parse(raw));
  } catch {
    return fail("Descrição inválida.", 400);
  }
  if (!body.success)
    return fail("Descreva sua arte em 8 a 800 caracteres.", 400);
  try {
    const sql = neon(process.env.DATABASE_URL);
    const ip = process.env.VERCEL
      ? request.headers.get("x-vercel-forwarded-for") || "unknown"
      : "local";
    const bucket = createHash("sha256").update(ip).digest("hex");
    // Both reservations are transactional. Failed provider requests still count toward the cost cap.
    const reservations = await sql.transaction([
      sql`INSERT INTO expressao.ai_generation_limits (bucket, day, count) VALUES ('global', CURRENT_DATE, 1)
          ON CONFLICT (bucket, day) DO UPDATE SET count = expressao.ai_generation_limits.count + 1
          WHERE expressao.ai_generation_limits.count < 20 RETURNING count`,
      sql`INSERT INTO expressao.ai_generation_limits (bucket, day, count) VALUES (${bucket}, CURRENT_DATE, 1)
          ON CONFLICT (bucket, day) DO UPDATE SET count = expressao.ai_generation_limits.count + 1
          WHERE expressao.ai_generation_limits.count < 3 RETURNING count`,
    ]);
    if (reservations.some((rows) => rows.length === 0))
      return fail(
        "Limite diário de geração atingido. Tente novamente amanhã.",
        429,
      );
    const result = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
        n: 1,
        size: "1024x1024",
        quality: "medium",
        output_format: "png",
        prompt: `Crie somente uma arte gráfica para aplicação em uniforme, sem mockup, sem camiseta, centralizada, com fundo branco liso. Briefing do cliente: ${body.data.prompt}`,
      }),
      signal: AbortSignal.timeout(150000),
    });
    if (!result.ok)
      return fail(
        "O serviço de IA não conseguiu gerar a arte. Tente mais tarde.",
        502,
      );
    const data = await result.json();
    const base64 = data.data?.[0]?.b64_json;
    if (typeof base64 !== "string")
      return fail("O serviço não retornou uma imagem.", 502);
    return Response.json(
      { image: `data:image/png;base64,${base64}` },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return fail(
      "A geração está indisponível no momento. Tente mais tarde.",
      503,
    );
  }
}
