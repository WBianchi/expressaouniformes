"use client";
// Troca a cor da peça na foto (no navegador), para o cliente ver a peça na cor escolhida.
// Usa a máscara peça × fundo gerada offline (scripts/generate-masks.py) e mantém as
// sombras e dobras do tecido: a claridade de cada ponto é deslocada para a da cor nova
// (espaço CIELAB). Botões, faixas refletivas e partes de outra cor ficam como estão.
import { useEffect, useState } from "react";

/** Máscara da foto: /images/products/x.webp → /images/products/masks/x.png */
export const maskFor = (src: string) => src.replace(/\/([^/]+)\.webp$/, "/masks/$1.png");

const SIZE = 900; // resolução de trabalho (as fotos aparecem com até ~650px)

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

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const lr = TO_LIN[r], lg = TO_LIN[g], lb = TO_LIN[b];
  const x = (0.4124 * lr + 0.3576 * lg + 0.1805 * lb) / XN;
  const y = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  const z = (0.0193 * lr + 0.1192 * lg + 0.9505 * lb) / ZN;
  const fx = fLab(x), fy = fLab(y), fz = fLab(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const toByte = (c: number) => FROM_LIN[Math.max(0, Math.min(4095, Math.round(c * 4095)))];
function labToRgb(L: number, a: number, b: number, out: Uint8ClampedArray, i: number) {
  const fy = (L + 16) / 116;
  const x = fInv(fy + a / 500) * XN, y = fInv(fy), z = fInv(fy - b / 200) * ZN;
  out[i] = toByte(3.2406 * x - 1.5372 * y - 0.4986 * z);
  out[i + 1] = toByte(-0.9689 * x + 1.8758 * y + 0.0415 * z);
  out[i + 2] = toByte(0.0557 * x - 0.204 * y + 1.057 * z);
}

const median = (arr: Float32Array, n: number) => {
  const a = arr.slice(0, n).sort();
  return a[Math.floor(n / 2)] ?? 0;
};

type Prepared = { w: number; h: number; rgba: Uint8ClampedArray; L: Float32Array; A: Float32Array; B: Float32Array; m: Float32Array; Lm: number; am: number; bm: number };

const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((ok, fail) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => ok(img);
    img.onerror = fail;
    img.src = src;
  });

const prepared = new Map<string, Promise<Prepared>>();
/** Lê a foto e a máscara uma vez só e guarda a cor de cada ponto em CIELAB. */
function prepare(src: string): Promise<Prepared> {
  let p = prepared.get(src);
  if (!p) {
    p = (async () => {
      const [img, mask] = await Promise.all([loadImg(src), loadImg(maskFor(src))]);
      const w = Math.min(SIZE, img.naturalWidth), h = Math.round((w / img.naturalWidth) * img.naturalHeight);
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(mask, 0, 0, w, h);
      const md = ctx.getImageData(0, 0, w, h).data;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const rgba = ctx.getImageData(0, 0, w, h).data;
      const n = w * h;
      const L = new Float32Array(n), A = new Float32Array(n), B = new Float32Array(n), m = new Float32Array(n);
      const gl = new Float32Array(n), ga = new Float32Array(n), gb = new Float32Array(n);
      let k = 0;
      for (let i = 0; i < n; i++) {
        const [l, a, b] = rgbToLab(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
        L[i] = l;
        A[i] = a;
        B[i] = b;
        m[i] = md[i * 4] / 255;
        if (m[i] > 0.5) {
          gl[k] = l;
          ga[k] = a;
          gb[k++] = b;
        }
      }
      return { w, h, rgba, L, A, B, m, Lm: median(gl, k), am: median(ga, k), bm: median(gb, k) };
    })();
    p.catch(() => prepared.delete(src));
    prepared.set(src, p);
  }
  return p;
}

const results = new Map<string, Promise<string>>();
/** Foto da peça na cor `hex` (URL de objeto, guardada em cache). */
export function recolor(src: string, hex: string): Promise<string> {
  const key = `${src}|${hex}`;
  let r = results.get(key);
  if (!r) {
    r = prepare(src).then((P) => {
      const n = P.w * P.h;
      const [tL, ta, tb] = rgbToLab(parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16));
      // peça escura: as dobras têm pouca variação de claridade, então reforça um pouco
      const gain = P.Lm < 25 ? 1.5 : 1;
      const out = new Uint8ClampedArray(P.rgba);
      const px = new Uint8ClampedArray(3);
      for (let i = 0; i < n; i++) {
        const mi = P.m[i];
        if (mi <= 0.01) continue;
        const dL = P.L[i] - P.Lm;
        const dab = Math.hypot(P.A[i] - P.am, P.B[i] - P.bm);
        // muito diferente da cor principal (botão, faixa, peça por baixo): fica como está
        const keep = Math.min(1, Math.max(0, Math.abs(dL) - 45) / 10 + Math.max(0, dab - 30) / 15);
        const a = mi * (1 - keep);
        if (a <= 0.01) continue;
        const Lo = Math.max(2, Math.min(99, tL + dL * gain));
        const cs = Math.max(0.6, Math.min(1, 1 - Math.abs(Lo - tL) / 120));
        labToRgb(Lo, ta * cs, tb * cs, px, 0);
        const j = i * 4;
        out[j] = P.rgba[j] * (1 - a) + px[0] * a;
        out[j + 1] = P.rgba[j + 1] * (1 - a) + px[1] * a;
        out[j + 2] = P.rgba[j + 2] * (1 - a) + px[2] * a;
      }
      const cv = document.createElement("canvas");
      cv.width = P.w;
      cv.height = P.h;
      cv.getContext("2d")!.putImageData(new ImageData(out, P.w, P.h), 0, 0);
      return new Promise<string>((ok, fail) => cv.toBlob((b) => (b ? ok(URL.createObjectURL(b)) : fail(new Error("toBlob"))), "image/webp", 0.9));
    });
    r.catch(() => results.delete(key));
    results.set(key, r);
  }
  return r;
}

/**
 * Foto na cor escolhida: devolve a original enquanto processa (ou se `hex` for nulo,
 * isto é, a cor da própria foto) e troca quando a versão recolorida fica pronta.
 */
export function useRecolored(src: string, hex: string | null | undefined): string {
  const [done, setDone] = useState<{ key: string; url: string } | null>(null);
  const key = hex ? `${src}|${hex}` : "";
  useEffect(() => {
    if (!hex) return;
    let live = true;
    recolor(src, hex)
      .then((url) => live && setDone({ key: `${src}|${hex}`, url }))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [src, hex]);
  if (!hex) return src;
  // enquanto a cor nova não fica pronta, mantém a última recolorida desta foto (evita piscar)
  return done && (done.key === key || done.key.startsWith(`${src}|`)) ? done.url : src;
}
