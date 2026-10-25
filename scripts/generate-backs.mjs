#!/usr/bin/env node
// Gera as vistas de costas e de lado de cada produto a partir da foto frontal
// (OpenAI Images edits), mesmo enquadramento, para a galeria e a prévia da logo.
//
// Uso:
//   node --env-file=.env.local scripts/generate-backs.mjs [--view=costas|lado] [--force] [--only=polo-pv-basica,...]
//
// Saída: public/images/products/<slug>-costas.webp ou <slug>-lado.webp (1024x1024, WebP q82).
// A chave OPENAI_API_KEY vem do ambiente e nunca é impressa.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "public", "images", "products");
const MODEL = process.env.IMAGE_MODEL || "gpt-image-2.5-sunburst";
const PRICE = { textIn: 5, imageIn: 8, imageOut: 30 };

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const ONLY = args.find((a) => a.startsWith("--only="))?.split("=")[1]?.split(",");
const VIEW = args.find((a) => a.startsWith("--view="))?.split("=")[1] ?? "costas";
if (!["costas", "lado"].includes(VIEW)) throw new Error("--view deve ser costas ou lado");

const BACK =
  "Show the BACK VIEW of this exact same garment: same fabric, same color, same trims, same lighting, same seamless light grey background, " +
  "same camera distance, same framing and same size in the frame, perfectly centered, invisible ghost mannequin (no person, no hanger). " +
  "The back is completely plain: no print, no embroidery, no logo, no text, no labels or tags. Realistic seams (back yoke, collar from behind, sleeve hems). " +
  "Premium e-commerce packshot, catalog consistency.";

const SIDE =
  "Show the SIDE VIEW (left profile, rotated 90 degrees) of this exact same garment: same fabric, same color, same collar, buttons and trims, same lighting, " +
  "same seamless light grey background, same camera distance and same size in the frame, perfectly centered, invisible ghost mannequin (no person, no hanger). " +
  "Realistic 3D volume of a worn garment seen from the side: the left sleeve facing the camera, side seam visible, collar in profile. " +
  "Completely plain: no print, no embroidery, no logo, no text, no labels or tags. Premium e-commerce packshot, catalog consistency.";

const PROMPT = VIEW === "lado" ? SIDE : BACK;

const py = (code, ...a) => {
  const r = spawnSync("python3", ["-c", code, ...a], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr || "python falhou");
};
const TO_PNG = `import sys
from PIL import Image
Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2], "PNG")`;
const TO_WEBP = `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB").resize((1024, 1024), Image.LANCZOS)
im.save(sys.argv[2], "WEBP", quality=82, method=6)`;

async function edit(pngPath) {
  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", PROMPT);
  form.append("size", "1024x1024");
  form.append("quality", "high");
  form.append("n", "1");
  form.append("image[]", new Blob([readFileSync(pngPath)], { type: "image/png" }), "front.png");
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}: ${json?.error?.message ?? "erro"}`), { retryable: res.status === 429 || res.status >= 500 });
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw Object.assign(new Error("resposta sem imagem"), { retryable: true });
  const u = json.usage ?? {};
  const d = u.input_tokens_details ?? {};
  const cost = ((d.text_tokens ?? 0) * PRICE.textIn + (d.image_tokens ?? 0) * PRICE.imageIn + (u.output_tokens ?? 0) * PRICE.imageOut) / 1e6;
  return { buffer: Buffer.from(b64, "base64"), cost };
}

async function run(slug) {
  const out = join(DIR, `${slug}-${VIEW}.webp`);
  if (!FORCE && existsSync(out)) return console.log(`- ${slug} já existe`);
  const front = join(DIR, `${slug}.webp`);
  const inPng = join(DIR, `${slug}.in.tmp.png`);
  const outPng = join(DIR, `${slug}.out.tmp.png`);
  py(TO_PNG, front, inPng);
  try {
    for (let attempt = 1; ; attempt++) {
      try {
        const { buffer, cost } = await edit(inPng);
        writeFileSync(outPng, buffer);
        py(TO_WEBP, outPng, out);
        console.log(`✓ ${slug} (~US$ ${cost.toFixed(3)})`);
        return cost;
      } catch (e) {
        if (attempt >= 4 || !e.retryable) throw e;
        await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
      }
    }
  } finally {
    for (const f of [inPng, outPng]) if (existsSync(f)) unlinkSync(f);
  }
}

if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY ausente (rode com --env-file=.env.local)");
const slugs = (ONLY ?? readdirSync(DIR).filter((f) => f.endsWith(".webp") && !/-(costas|lado|modelo-\d)\.webp$/.test(f)).map((f) => f.replace(/\.webp$/, "")));
let total = 0;
const queue = [...slugs];
await Promise.all(
  Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const slug = queue.shift();
      try {
        const cost = await run(slug);
        total += cost ?? 0;
      } catch (e) {
        console.log(`✗ ${slug}: ${e.message}`);
      }
    }
  }),
);
console.log(`fim. custo estimado: ~US$ ${total.toFixed(2)}`);
