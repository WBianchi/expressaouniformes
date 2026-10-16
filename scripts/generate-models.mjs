#!/usr/bin/env node
// Gera fotos de vitrine com modelos (IA, fotorrealistas) vestindo cada peça, a partir da
// foto frontal do produto (OpenAI Images edits). Duas fotos por produto, com pessoas
// diferentes: 1) estúdio (fundo claro, padrão de catálogo) 2) em ambiente de trabalho.
// O simulador de logo continua usando as fotos sem modelo (frente/costas).
//
// Uso:
//   node --env-file=.env.local scripts/generate-models.mjs [--force] [--only=polo-pv-basica,...]
//
// Saída: public/images/products/<slug>-modelo-1.webp e -modelo-2.webp (1024x1536, WebP q82).
// A chave OPENAI_API_KEY vem do ambiente e nunca é impressa.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "public", "images", "products");
const MODEL = process.env.IMAGE_MODEL || "gpt-image-2.5-sunburst";
const PRICE = { textIn: 5, imageIn: 8, imageOut: 30 };

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const ONLY = args.find((a) => a.startsWith("--only="))?.split("=")[1]?.split(",");

// Elenco: cada produto com duas pessoas diferentes (idade, gênero, etnia, biotipo variados).
// [pessoa no estúdio, pessoa + ambiente de trabalho]
const CAST = {
  "polo-pv-basica": [
    "a Brazilian man in his 30s, light brown skin, short dark hair, friendly smile",
    "a Black Brazilian woman in her 40s with short natural curly hair, standing at the front desk of a modern office reception",
  ],
  "polo-piquet-basica": [
    "a Brazilian woman in her 20s with long straight black hair and East Asian features",
    "a white Brazilian man in his 50s with grey beard, slightly heavier build, in a hardware store aisle",
  ],
  "polo-dry-fit-basica": [
    "a young Black Brazilian man, athletic build, shaved head",
    "a Brazilian woman in her 30s, tan skin, hair in a ponytail, working at a gym reception counter",
  ],
  "polo-piquet-feminina": [
    "a Brazilian woman in her 30s, medium brown skin, wavy shoulder-length hair",
    "a white Brazilian woman in her 50s with short blonde hair and glasses, at a pharmacy counter",
  ],
  "camiseta-algodao-basica": [
    "a Brazilian man in his 20s with curly hair, mixed-race (pardo)",
    "a Brazilian woman in her 20s with long dark braids, Black, volunteering at an outdoor community event",
  ],
  "camiseta-dry-fit": [
    "a white Brazilian woman in her 20s with red hair tied up, slim build",
    "a Brazilian man in his 40s, Indigenous Brazilian features, coaching at an outdoor sports field",
  ],
  "calca-brim-profissional": [
    "a Brazilian man in his 30s, brown skin, wearing a plain white t-shirt and black work boots, full body",
    "a Brazilian woman in her 30s with hair in a bun, wearing a plain grey t-shirt and safety boots, full body, in a clean warehouse with shelves",
  ],
  "jaleco-gabardine": [
    "a Brazilian woman in her 40s, Japanese-Brazilian, hair in a low bun, wearing it open over a plain top",
    "a Black Brazilian man in his 30s with a short beard, in a bright dental clinic",
  ],
  "moletom-canguru": [
    "a white Brazilian man in his 20s with messy light brown hair",
    "a Brazilian woman in her 30s, pardo, curly hair, in a modern coworking space",
  ],
  "camisa-operacional-brim": [
    "a Brazilian man in his 40s, dark brown skin, moustache, sturdy build",
    "a young Brazilian woman, light skin, hair in a braid, wearing a white hard hat, at an industrial plant",
  ],
  "dolma-chef": [
    "a Brazilian man in his 30s, Black, short hair, confident chef look",
    "a white Brazilian woman in her 40s with hair tucked in a black chef cap, in a professional stainless steel kitchen",
  ],
  "camiseta-alta-visibilidade": [
    "a Brazilian man in his 50s, tan weathered skin, grey stubble",
    "a Brazilian woman in her 20s, pardo, hair in a ponytail, wearing a white hard hat, at a road construction site",
  ],
  "polo-com-friso": [
    "a Brazilian woman in her 20s, Black, natural afro hair",
    "a white Brazilian man in his 30s with short beard, in a car dealership showroom",
  ],
  "polo-bicolor": [
    "a Brazilian man in his 40s, East Asian-Brazilian, neat short hair",
    "a Brazilian woman in her 30s, brown skin, long wavy hair, at a supermarket checkout",
  ],
  "polo-gola-personalizada": [
    "a white Brazilian woman in her 30s with a dark brown bob haircut",
    "a Brazilian man in his 20s, Black, short twists, at a hotel reception",
  ],
  "polo-manga-longa": [
    "a Brazilian man in his 30s, pardo, short hair, slim build",
    "a Brazilian woman in her 40s, light brown skin, hair tied back, at a logistics distribution center",
  ],
  "polo-alta-visibilidade": [
    "a Brazilian woman in her 30s, Black, hair in a bun",
    "a white Brazilian man in his 40s with a beard, wearing a white hard hat, at a port terminal with containers",
  ],
};

const GARMENT =
  "wearing EXACTLY the garment shown in the reference image: same color, same fabric texture, same collar, buttons, trims and cut. " +
  "The garment is completely plain: no logo, no print, no embroidery, no text, no badges. ";
const COMMON =
  "Photorealistic, natural skin texture, real person (not a mannequin, not illustration), natural relaxed pose, looking at camera or slightly away. " +
  "Shot on a full-frame camera, 85mm, soft natural light, sharp focus on the garment. Vertical portrait framing with the garment fully visible and centered, " +
  "some space above the head. No text, no watermark.";

const prompts = (slug) => {
  const [studio, onSite] = CAST[slug];
  const pants = slug.startsWith("calca");
  const frame = pants ? "Full body from head to shoes. " : "Framed from head to mid-thigh. ";
  return [
    `E-commerce catalog photo of ${studio}, ${GARMENT}${frame}Seamless light warm-grey studio background, clean and minimal. ${COMMON}`,
    `Lifestyle photo of ${onSite}, ${GARMENT}${frame}Real workplace background, softly blurred (shallow depth of field). ${COMMON}`,
  ];
};

const py = (code, ...a) => {
  const r = spawnSync("python3", ["-c", code, ...a], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr || "python falhou");
};
const TO_PNG = `import sys
from PIL import Image
Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2], "PNG")`;
const TO_WEBP = `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB").resize((1024, 1536), Image.LANCZOS)
im.save(sys.argv[2], "WEBP", quality=82, method=6)`;

async function edit(pngPath, prompt) {
  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", prompt);
  form.append("size", "1024x1536");
  form.append("quality", "high");
  form.append("n", "1");
  form.append("image[]", new Blob([readFileSync(pngPath)], { type: "image/png" }), "garment.png");
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

async function run({ slug, n, prompt }) {
  const out = join(DIR, `${slug}-modelo-${n}.webp`);
  if (!FORCE && existsSync(out)) return console.log(`- ${slug} #${n} já existe`);
  const inPng = join(DIR, `${slug}.m${n}.in.tmp.png`);
  const outPng = join(DIR, `${slug}.m${n}.out.tmp.png`);
  py(TO_PNG, join(DIR, `${slug}.webp`), inPng);
  try {
    for (let attempt = 1; ; attempt++) {
      try {
        const { buffer, cost } = await edit(inPng, prompt);
        writeFileSync(outPng, buffer);
        py(TO_WEBP, outPng, out);
        console.log(`✓ ${slug} #${n} (~US$ ${cost.toFixed(3)})`);
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
const slugs = ONLY ?? Object.keys(CAST);
const queue = slugs.flatMap((slug) => prompts(slug).map((prompt, i) => ({ slug, n: i + 1, prompt })));
let total = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const job = queue.shift();
      try {
        const cost = await run(job);
        total += cost ?? 0;
      } catch (e) {
        console.log(`✗ ${job.slug} #${job.n}: ${e.message}`);
      }
    }
  }),
);
console.log(`fim. custo estimado: ~US$ ${total.toFixed(2)}`);
