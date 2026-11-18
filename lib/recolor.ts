"use client";
// Troca a cor da peça na foto (no navegador), para o cliente ver a peça na cor escolhida.
// Usa a máscara peça × fundo (gerada offline por scripts/generate-masks.py para as fotos do
// catálogo; calculada na hora por lib/auto-mask.ts para as fotos enviadas pelo painel) e
// mantém as sombras e dobras do tecido: a claridade de cada ponto é deslocada para a da cor
// nova (espaço CIELAB). Botões, faixas refletivas e partes de outra cor ficam como estão.
import { useEffect, useState } from "react";
import { labToRgb, rgbToLab } from "./lab.ts";
import { autoMask } from "./auto-mask.ts";

/** Máscara pronta da foto do catálogo (/images/products/x.webp → /images/products/masks/x.png); foto do painel não tem. */
export const maskFor = (src: string) => (/^\/images\/products\/[^/]+\.webp$/.test(src) ? src.replace(/\/([^/]+)\.webp$/, "/masks/$1.png") : null);

const SIZE = 900; // resolução de trabalho (as fotos aparecem com até ~650px)

const median = (arr: Float32Array, n: number) => {
  const a = arr.slice(0, n).sort();
  return a[Math.floor(n / 2)] ?? 0;
};

type Prepared = { w: number; h: number; rgba: Uint8ClampedArray; L: Float32Array; A: Float32Array; B: Float32Array; m: Float32Array; Lm: number; am: number; bm: number };

const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((ok, fail) => {
    const img = new Image();
    img.decoding = "async";
    // foto do painel (Vercel Blob, outro domínio): sem isso o canvas não deixa ler os pixels
    if (/^https?:/.test(src)) img.crossOrigin = "anonymous";
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
      const own = maskFor(src);
      const [img, mask] = await Promise.all([loadImg(src), own ? loadImg(own).catch(() => null) : null]);
      const w = Math.min(SIZE, img.naturalWidth), h = Math.round((w / img.naturalWidth) * img.naturalHeight);
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext("2d", { willReadFrequently: true })!;
      let md: Uint8ClampedArray | null = null;
      if (mask) {
        ctx.drawImage(mask, 0, 0, w, h);
        md = ctx.getImageData(0, 0, w, h).data;
        ctx.clearRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      const rgba = ctx.getImageData(0, 0, w, h).data;
      const n = w * h;
      const L = new Float32Array(n), A = new Float32Array(n), B = new Float32Array(n);
      let transparent = false;
      for (let i = 0; i < n; i++) {
        const [l, a, b] = rgbToLab(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
        L[i] = l;
        A[i] = a;
        B[i] = b;
        if (rgba[i * 4 + 3] < 250) transparent = true;
      }
      // máscara: a pronta do catálogo; PNG com fundo transparente usa a própria transparência;
      // senão, calculada a partir da foto (fundo liso)
      const m = new Float32Array(n);
      if (md) for (let i = 0; i < n; i++) m[i] = md[i * 4] / 255;
      else if (transparent) for (let i = 0; i < n; i++) m[i] = rgba[i * 4 + 3] / 255;
      else m.set(autoMask(L, A, B, w, h));
      const gl = new Float32Array(n), ga = new Float32Array(n), gb = new Float32Array(n);
      let k = 0;
      for (let i = 0; i < n; i++) {
        const l = L[i], a = A[i], b = B[i];
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

/** Máscara peça × fundo da foto (a mesma usada na troca de cor), para o simulador medir o contorno da peça. */
export function pieceMask(src: string): Promise<{ w: number; h: number; m: Float32Array }> {
  return prepare(src).then(({ w, h, m }) => ({ w, h, m }));
}

// ruído determinístico (mesmo granulado sempre, sem "chiar" ao trocar de cor)
const hash = (x: number, y: number, seed: number) => {
  let v = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041)) >>> 0;
  v = Math.imul(v ^ (v >>> 13), 1274126177) >>> 0;
  return ((v ^ (v >>> 16)) & 0xffff) / 65535 - 0.5;
};
/** Malha mesclada: grão fino + fiapos curtos na vertical, como os fios de dois tons. */
const heather = (x: number, y: number) => 20 * (0.45 * hash(x, y, 1) + 0.35 * hash(x, (y / 3) | 0, 2) + 0.2 * hash((x / 2) | 0, (y / 6) | 0, 3));

const results = new Map<string, Promise<string>>();
/** Foto da peça na cor `tint` ("#rrggbb", ou "#rrggbb:mescla" para malha mesclada), em cache. */
export function recolor(src: string, tint: string): Promise<string> {
  const key = `${src}|${tint}`;
  const [hex, pattern] = tint.split(":");
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
        const Lo = Math.max(2, Math.min(99, tL + dL * gain + (pattern === "mescla" ? heather(i % P.w, (i / P.w) | 0) : 0)));
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
