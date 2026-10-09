// Gera uma miniatura leve da logo para guardar no carrinho (localStorage).
// O arquivo original não é persistido no navegador.

export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
export const LOGO_MAX_BYTES = 10 * 1024 * 1024;
/** ~150 KB em base64 */
const MAX_DATAURL = 200_000;

export function validateLogo(file: File): string | null {
  const okType = LOGO_TYPES.includes(file.type) || /\.(png|jpe?g|webp|svg)$/i.test(file.name);
  if (!okType) return "Formato não suportado. Envie PNG, JPG, WebP ou SVG.";
  if (file.size > LOGO_MAX_BYTES) return "Arquivo muito grande. O limite é 10 MB.";
  if (file.size === 0) return "Arquivo vazio.";
  return null;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    img.src = url;
  });
}

/** Retorna dataURL (webp, ou png quando o navegador não codifica webp) com lado máximo ≤ 400 px e ≤ ~150 KB. */
export async function makeLogoThumb(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    // SVG sem dimensões intrínsecas: assume 400 px
    const w0 = img.naturalWidth || 400;
    const h0 = img.naturalHeight || 400;
    for (const side of [400, 320, 240, 160]) {
      const scale = Math.min(1, side / Math.max(w0, h0));
      const w = Math.max(1, Math.round(w0 * scale));
      const h = Math.max(1, Math.round(h0 * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas indisponível.");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, w, h);
      for (const q of [0.88, 0.72, 0.56]) {
        let data = canvas.toDataURL("image/webp", q);
        if (!data.startsWith("data:image/webp")) data = canvas.toDataURL("image/png");
        if (data.length <= MAX_DATAURL) return data;
        if (data.startsWith("data:image/png")) break; // png não tem qualidade: reduz o tamanho
      }
    }
    throw new Error("Não foi possível gerar uma miniatura leve desta imagem.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const formatBytes = (n: number) =>
  n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
