// Peças comuns às server actions do painel (mídia, anúncios, artes): sessão, banco, cache e Blob.
import "server-only";
import { del } from "@vercel/blob";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { MEDIA_TAG } from "@/lib/site-media";
import { syncCatalog } from "@/lib/listings-server";

export type MediaResult = { ok: true } | { ok: false; error: string };

/** Banco com a sessão de admin conferida. */
export async function adminDb() {
  if (!(await isAdmin())) throw new Error("Sessão expirada. Entre no painel novamente.");
  if (!process.env.DATABASE_URL) throw new Error("Banco de dados não configurado.");
  const { neon } = await import("@neondatabase/serverless");
  return neon(process.env.DATABASE_URL);
}

/** Banco com a sessão conferida e o catálogo com as edições mais novas do painel (para validar). */
export async function adminCatalog() {
  const sql = await adminDb();
  await syncCatalog(true);
  return sql;
}

/** Conteúdo da loja mudou: invalida o cache e as páginas geradas. */
export function refreshSite() {
  updateTag(MEDIA_TAG);
  revalidatePath("/", "layout");
}

/** Apaga do Blob imagens enviadas pelo painel que não são mais usadas. */
export async function dropBlob(url: string | undefined) {
  if (url && /\.public\.blob\.vercel-storage\.com\//.test(url)) await del(url).catch(() => {});
}

/** Roda a ação e devolve { ok } ou a mensagem de erro (validação ou banco), sem lançar para o navegador. */
export async function runAction(fn: () => Promise<void>, after: () => void = refreshSite): Promise<MediaResult> {
  try {
    await fn();
    after();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof z.ZodError ? (e.issues[0]?.message ?? "Dados inválidos.") : e instanceof Error ? e.message : "Erro ao salvar." };
  }
}
