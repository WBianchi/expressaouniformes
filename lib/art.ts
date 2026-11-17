// Artes (logos) dos pedidos: arquivo original enviado pelo cliente e revisão no painel
// (Personalizações). Puro: usado no navegador, nas rotas e nos testes.

export const ART_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"] as const;
export const ART_MAX_BYTES = 10 * 1024 * 1024;

/** Arquivo original da logo guardado no Vercel Blob (pasta artes/, nome com sufixo aleatório). */
export const isArtUrl = (u: string) => /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/artes\/[A-Za-z0-9._-]{1,140}$/.test(u);

/** Caminho no Blob para o original: artes/<nome-limpo>.<extensão>. */
export function artPath(fileName: string, type: string) {
  const ext = (fileName.match(/\.(png|jpe?g|webp|svg)$/i)?.[1] ?? { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg" }[type] ?? "png").toLowerCase();
  const base =
    fileName
      .toLowerCase()
      .replace(/\.[^.]+$/, "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "logo";
  return `artes/${base}.${ext}`;
}

/** Tipo do arquivo pela extensão quando o navegador não informa (SVG em alguns sistemas). */
export const artContentType = (file: { name: string; type: string }) =>
  (ART_TYPES as readonly string[]).includes(file.type)
    ? file.type
    : /\.svg$/i.test(file.name)
      ? "image/svg+xml"
      : /\.png$/i.test(file.name)
        ? "image/png"
        : /\.webp$/i.test(file.name)
          ? "image/webp"
          : "image/jpeg";

export const artStatuses = ["revisao", "ajuste", "aprovada"] as const;
export type ArtStatus = (typeof artStatuses)[number];
export type ArtReview = { status: ArtStatus; note?: string; updatedAt?: string };

export const artStatusInfo: Record<ArtStatus, { label: string; tone: "amber" | "blue" | "green" }> = {
  revisao: { label: "Aguardando revisão", tone: "amber" },
  ajuste: { label: "Ajuste pedido", tone: "blue" },
  aprovada: { label: "Arte aprovada", tone: "green" },
};

/** Link do WhatsApp para o telefone do cliente (DDD + número; acrescenta o 55 do Brasil). */
export function customerWhatsapp(phone: string | undefined, text: string) {
  let d = (phone ?? "").replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  if (d.length < 12 || d.length > 13) return null;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

/** Mensagem pronta do pedido de ajuste da arte. */
export function adjustmentMessage(o: { name: string; orderId: string; note: string }) {
  const first = o.name.trim().split(/\s+/)[0] ?? "";
  return (
    `Olá${first ? `, ${first}` : ""}! Aqui é da Expressão Uniformes, sobre o pedido ${o.orderId}. ` +
    `Revisamos a arte da sua logo e precisamos de um ajuste antes de produzir: ${o.note.trim()} ` +
    `Pode nos enviar a arte ajustada por aqui? Assim que recebermos, seguimos com a produção.`
  );
}
