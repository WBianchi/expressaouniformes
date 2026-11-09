#!/usr/bin/env node
// Gera as fotos dos produtos do catálogo oficial (PDF "CATALOGO EXPRESSAO") a partir
// das páginas renderizadas: usa a área das fotos de cada página como referência
// (OpenAI Images edits) e produz fotos limpas, em estúdio claro:
//   <slug>-modelo-1.webp  modelo vestindo a peça, de frente (1024x1536)
//   <slug>-modelo-2.webp  modelo vestindo a peça, de costas (1024x1536)
//   <slug>.webp           a peça sozinha, de frente (manequim invisível, 1024x1024)
// Costas e lado da peça sozinha saem depois com scripts/generate-backs.mjs.
//
// Uso:
//   node --env-file=.env.local scripts/generate-catalog.mjs --pages=<pasta com full-04.jpg…> [--force] [--only=slug,...] [--kind=modelo-1,packshot]
// A chave OPENAI_API_KEY vem do ambiente e nunca é impressa.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "images", "products");
const MODEL = process.env.IMAGE_MODEL || "gpt-image-2.5-sunburst";
const PRICE = { textIn: 5, imageIn: 8, imageOut: 30 };

const args = process.argv.slice(2);
const arg = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const FORCE = args.includes("--force");
const ONLY = arg("only")?.split(",");
const KINDS = arg("kind")?.split(",") ?? ["modelo-1", "modelo-2", "packshot"];
const PAGES = arg("pages");
if (!PAGES) throw new Error("--pages=<pasta das páginas renderizadas> é obrigatório");

// slug → página do PDF e descrição da peça (ajuda o modelo a não inventar detalhes)
const ITEMS = [
  ["camiseta-malha-pv", 4, "short-sleeve crew neck t-shirt in PV knit fabric", "top"],
  ["camiseta-baby-look", 5, "women's fitted short-sleeve baby look t-shirt, crew neck", "top"],
  ["polo-masculina-piquet", 6, "men's short-sleeve pique polo shirt, polo collar with 2 buttons", "top"],
  ["polo-feminina-piquet", 7, "women's fitted short-sleeve pique polo shirt, polo collar with 2 buttons", "top"],
  ["camiseta-malha-pv-manga-longa", 8, "long-sleeve crew neck t-shirt in PV knit fabric", "top"],
  ["jaleco-gola-italiana", 9, "short-sleeve work shirt with italian collar (open V neck, no buttons) and 1 chest pocket, light cotton twill", "top"],
  ["jaleco-gola-italiana-manga-longa", 10, "long-sleeve work shirt with italian collar (open V neck, no buttons) and 1 chest pocket, light cotton twill", "top"],
  ["jaleco-com-botoes", 11, "short-sleeve work shirt with standard collar, front button closure and 1 chest pocket, light cotton twill", "top"],
  ["jaleco-com-botoes-manga-longa", 12, "long-sleeve work jacket with standard collar, front button closure and pockets, light cotton twill", "top"],
  ["jaleco-guarda-po", 13, "short-sleeve long work coat (guarda-pó) with collar, front buttons and lower pockets, longer length to mid-thigh", "coat"],
  ["jaleco-guarda-po-manga-longa", 14, "long-sleeve long work coat (guarda-pó) with collar, front buttons and lower pockets, length to mid-thigh", "coat"],
  ["jaleco-tradicional", 15, "short-sleeve classic lab coat with lapel collar, front buttons and pockets, oxford fabric", "coat"],
  ["jaleco-tradicional-manga-longa", 16, "long-sleeve classic lab coat with lapel collar, front buttons and pockets, oxford fabric", "coat"],
  ["camisa-social-masculina-manga-longa", 17, "men's long-sleeve dress shirt with button front and buttoned cuffs, tricoline cotton", "top"],
  ["camisa-social-masculina", 18, "men's short-sleeve dress shirt with button front, tricoline cotton", "top"],
  ["camisa-social-feminina", 19, "women's short-sleeve fitted dress shirt with button front, tricoline cotton", "top"],
  ["camisa-social-feminina-manga-longa", 20, "women's long-sleeve fitted dress shirt with button front, tricoline cotton", "top"],
  ["blusa-moletom", 21, "crew neck sweatshirt with ribbed cuffs and hem, fleece", "top"],
  ["moletom-canguru", 22, "pullover hoodie with hood, ribbed cuffs and front kangaroo pocket, fleece", "top"],
  ["bermuda-elastico-total", 23, "work shorts with full elastic waistband and 4 pockets, light cotton twill", "shorts"],
  ["bermuda-meio-cos", 24, "work shorts with structured half waistband, belt loops, zipper fly and 4 pockets, cotton twill", "shorts"],
  ["calca-brim-elastico-total", 25, "work pants with full elastic waistband with drawstring and 4 pockets, heavy cotton twill (brim)", "pants"],
  ["calca-meio-cos", 26, "work pants with structured half waistband, belt loops, zipper fly and 4 pockets, heavy cotton twill (brim)", "pants"],
  ["calca-jeans", 27, "dark navy denim jeans with 5 pockets, button and zipper fly", "pants"],
  ["calca-oxford", 28, "professional pants with elastic waistband with drawstring and pockets, oxford fabric", "pants"],
  ["avental-bata", 29, "short tabard apron (bata) worn over a t-shirt, open sides tied with cords, 2 front pockets, oxford fabric", "apron"],
  ["avental-frontal", 30, "bib apron with neck strap, waist ties and one wide front pocket, oxford fabric", "apron"],
  ["jaleco-limpeza", 31, "short-sleeve cleaning staff work shirt with collar, V opening and extra pockets, oxford fabric", "top"],
  ["jaleco-privativo", 32, "short-sleeve medical scrub top with V neck and 2 pockets, oxford fabric", "top"],
  ["colete-padrao", 33, "high visibility safety vest with zipper, pockets and reflective stripes, worn over a polo shirt", "vest"],
];

const FRAME = {
  top: "Framed from head to mid-thigh.",
  coat: "Framed from head to knees, the whole coat visible.",
  pants: "Full body from the waist to the shoes, the whole pants visible, wearing a plain light grey t-shirt.",
  shorts: "Framed from the waist to the feet, the whole shorts visible, wearing a plain light grey t-shirt.",
  apron: "Framed from head to knees, the whole apron visible, over a plain white t-shirt.",
  vest: "Framed from head to mid-thigh, the whole vest visible.",
};

const RULES =
  "The reference is a catalog page: IGNORE any text, logos, color charts, icons and the blue background. " +
  "Keep EXACTLY the same garment (same color, fabric, collar, buttons, pockets, trims, cut and length). " +
  "The garment is plain: no logo, no print, no embroidery, no text. Photorealistic, natural skin, real person, " +
  "soft studio light, seamless light warm-grey studio background, premium e-commerce catalog photo, sharp focus on the garment. No text, no watermark.";

const prompts = ([, , garment, kind]) => ({
  "modelo-1": {
    size: "1024x1536",
    prompt: `E-commerce photo of the SAME model shown on the LEFT of the reference, FRONT view, wearing this ${garment}. ${FRAME[kind]} Natural relaxed pose, looking at the camera. ${RULES}`,
  },
  "modelo-2": {
    size: "1024x1536",
    prompt: `E-commerce photo of the SAME model shown in the reference, seen from the BACK (back view, facing away from the camera), wearing this ${garment}. ${FRAME[kind]} ${RULES}`,
  },
  packshot: {
    size: "1024x1024",
    prompt:
      `Product packshot of ONLY this ${garment}, FRONT view, on an invisible ghost mannequin (no person, no hanger, no body visible), ` +
      "perfectly centered, filling about 75% of the frame height, seamless light grey background (#eef0f2), soft even studio light, realistic fabric texture and seams. " +
      "Same color, fabric, collar, buttons, pockets and trims as in the reference. IGNORE text, logos, color charts and the blue background of the reference. " +
      "Completely plain: no logo, no print, no text, no labels. Premium e-commerce catalog consistency.",
  },
});

const fileFor = (slug, kind) => join(OUT, kind === "packshot" ? `${slug}.webp` : `${slug}-${kind}.webp`);

const py = (code, ...a) => {
  const r = spawnSync("python3", ["-c", code, ...a], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr || "python falhou");
};
// área das fotos da página (entre a coluna de texto e a tabela de cores)
const CROP = `import sys
from PIL import Image
Image.open(sys.argv[1]).convert("RGB").crop((640, 0, 1960, 1350)).save(sys.argv[2], "PNG")`;
const TO_WEBP = `import sys
from PIL import Image
w, h = map(int, sys.argv[3].split("x"))
Image.open(sys.argv[1]).convert("RGB").resize((w, h), Image.LANCZOS).save(sys.argv[2], "WEBP", quality=82, method=6)`;

async function edit(png, prompt, size) {
  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", prompt);
  form.append("size", size);
  form.append("quality", "high");
  form.append("n", "1");
  form.append("image[]", new Blob([readFileSync(png)], { type: "image/png" }), "ref.png");
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

async function run({ item, kind }) {
  const [slug, page] = item;
  const out = fileFor(slug, kind);
  if (!FORCE && existsSync(out)) return console.log(`- ${slug} ${kind} já existe`), 0;
  const ref = join(OUT, `${slug}.${kind}.ref.tmp.png`);
  const tmp = join(OUT, `${slug}.${kind}.out.tmp.png`);
  py(CROP, join(PAGES, `full-${String(page).padStart(2, "0")}.jpg`), ref);
  const { prompt, size } = prompts(item)[kind];
  try {
    for (let attempt = 1; ; attempt++) {
      try {
        const { buffer, cost } = await edit(ref, prompt, size);
        writeFileSync(tmp, buffer);
        py(TO_WEBP, tmp, out, size);
        console.log(`✓ ${slug} ${kind} (~US$ ${cost.toFixed(3)})`);
        return cost;
      } catch (e) {
        if (attempt >= 4 || !e.retryable) throw e;
        await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
      }
    }
  } finally {
    for (const f of [ref, tmp]) if (existsSync(f)) unlinkSync(f);
  }
}

if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY ausente (rode com --env-file=.env.local)");
const items = ITEMS.filter(([slug]) => !ONLY || ONLY.includes(slug));
const queue = items.flatMap((item) => KINDS.map((kind) => ({ item, kind })));
let total = 0;
await Promise.all(
  Array.from({ length: 5 }, async () => {
    while (queue.length) {
      const job = queue.shift();
      try {
        const cost = await run(job);
        total += cost ?? 0;
      } catch (e) {
        console.log(`✗ ${job.item[0]} ${job.kind}: ${e.message}`);
      }
    }
  }),
);
console.log(`fim. custo estimado: ~US$ ${total.toFixed(2)}`);
