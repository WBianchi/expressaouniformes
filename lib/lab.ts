// Conversão sRGB ⇄ CIELAB (D65), usada na troca de cor das fotos e na máscara automática.
// Sem dependência do navegador, para rodar também nos testes.

// tabelas: sRGB (0..255) → linear e linear (0..4095) → sRGB
const TO_LIN = new Float32Array(256).map((_, i) => {
  const c = i / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});
const FROM_LIN = new Uint8ClampedArray(4096).map((_, i) => {
  const c = i / 4095;
  return Math.round((c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055) * 255);
});
const XN = 0.95047;
const ZN = 1.08883;
const fLab = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
const fInv = (t: number) => (t * t * t > 216 / 24389 ? t * t * t : (116 * t - 16) / (24389 / 27));

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const lr = TO_LIN[r], lg = TO_LIN[g], lb = TO_LIN[b];
  const x = (0.4124 * lr + 0.3576 * lg + 0.1805 * lb) / XN;
  const y = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  const z = (0.0193 * lr + 0.1192 * lg + 0.9505 * lb) / ZN;
  const fx = fLab(x), fy = fLab(y), fz = fLab(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const toByte = (c: number) => FROM_LIN[Math.max(0, Math.min(4095, Math.round(c * 4095)))];
export function labToRgb(L: number, a: number, b: number, out: Uint8ClampedArray, i: number) {
  const fy = (L + 16) / 116;
  const x = fInv(fy + a / 500) * XN, y = fInv(fy), z = fInv(fy - b / 200) * ZN;
  out[i] = toByte(3.2406 * x - 1.5372 * y - 0.4986 * z);
  out[i + 1] = toByte(-0.9689 * x + 1.8758 * y + 0.0415 * z);
  out[i + 2] = toByte(0.0557 * x - 0.204 * y + 1.057 * z);
}
