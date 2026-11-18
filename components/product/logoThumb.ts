// Gera uma miniatura leve da logo para guardar no carrinho (localStorage).
// O arquivo original não é persistido no navegador.
import { contentBox } from "@/lib/logo-trim";

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

/**
 * Prepara a logo para virar miniatura sem as bordas vazias (fundo transparente ou branco
 * sobrando em volta do desenho): assim o tamanho em cm e a posição valem para a logo de
 * verdade. Devolve uma função que desenha a logo cortada com lado máximo `side`.
 */
export function logoDrawer(img: HTMLImageElement) {
  // SVG sem dimensões intrínsecas: assume 400 px
  const w0 = img.naturalWidth || 400;
  const h0 = img.naturalHeight || 400;
  // procura o desenho numa cópia de até 1000 px (rápido e preciso o bastante)
  const a = Math.min(1, 1000 / Math.max(w0, h0));
  const probe = document.createElement("canvas");
  probe.width = Math.max(1, Math.round(w0 * a));
  probe.height = Math.max(1, Math.round(h0 * a));
  const pctx = probe.getContext("2d", { willReadFrequently: true });
  if (!pctx) throw new Error("Canvas indisponível.");
  pctx.drawImage(img, 0, 0, probe.width, probe.height);
  let box = { x: 0, y: 0, w: probe.width, h: probe.height };
  try {
    box = contentBox(pctx.getImageData(0, 0, probe.width, probe.height).data, probe.width, probe.height) ?? box;
  } catch {
    // navegador não deixou ler os pixels: usa a imagem inteira
  }
  // com dimensões conhecidas, recorta do arquivo original (mais nítido); senão, da cópia
  const fromImg = img.naturalWidth > 0 && img.naturalHeight > 0;
  const [sx, sy, sw, sh] = fromImg ? [box.x / a, box.y / a, box.w / a, box.h / a] : [box.x, box.y, box.w, box.h];
  return (side: number) => {
    const scale = Math.min(1, side / Math.max(sw, sh));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sw * scale));
    canvas.height = Math.max(1, Math.round(sh * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível.");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(fromImg ? img : probe, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    return canvas;
  };
}

/** Retorna dataURL (webp, ou png quando o navegador não codifica webp) com lado máximo ≤ 400 px e ≤ ~150 KB. */
export async function makeLogoThumb(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const draw = logoDrawer(img);
    for (const side of [400, 320, 240, 160]) {
      const canvas = draw(side);
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
