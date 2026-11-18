// Gera miniatura leve (dataURL) da logo para guardar no carrinho do navegador.
import { logoDrawer } from "@/components/product/logoThumb";

const MAX_FILE = 8 * 1024 * 1024;
const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export const LOGO_ACCEPT = ACCEPT.join(",");

export async function makeLogoThumb(file: File, size = 320): Promise<{ name: string; thumb: string }> {
  if (!ACCEPT.includes(file.type)) throw new Error("Envie PNG, JPG, WEBP ou SVG.");
  if (file.size > MAX_FILE) throw new Error("Arquivo maior que 8 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      i.src = url;
    });
    // sem as bordas vazias em volta do desenho, como no simulador
    const canvas = logoDrawer(img)(size);
    let thumb = canvas.toDataURL("image/webp", 0.85);
    if (!thumb.startsWith("data:image/webp")) thumb = canvas.toDataURL("image/png");
    if (thumb.length > 290_000) thumb = canvas.toDataURL("image/jpeg", 0.7);
    return { name: file.name.slice(0, 200), thumb };
  } finally {
    URL.revokeObjectURL(url);
  }
}
