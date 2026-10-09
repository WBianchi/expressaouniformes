#!/usr/bin/env node
// Gera as imagens da loja (produtos, categorias, banners) com a OpenAI Images API.
//
// Uso:
//   node --env-file=.env.local scripts/generate-images.mjs                 # gera o que falta
//   node --env-file=.env.local scripts/generate-images.mjs --force         # refaz tudo
//   node --env-file=.env.local scripts/generate-images.mjs --only=hero-1,polo-bicolor
//   node --env-file=.env.local scripts/generate-images.mjs --group=products
//   node --env-file=.env.local scripts/generate-images.mjs --compose-only  # só recompõe textos das categorias
//   node --env-file=.env.local scripts/generate-images.mjs --list
//
// Pipeline por job: API (PNG) -> Pillow (recorte cover + resize + WebP q82) -> remove PNG.
// Categorias: a IA gera a arte SEM texto (base salva em public/images/categories/_base/<slug>.webp)
// e o nome da categoria é composto com Pillow usando a fonte Sora (tipografia da marca, ortografia garantida).
// A chave OPENAI_API_KEY vem do ambiente e nunca é impressa.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public");
const MANIFEST = join(OUT, "images", "manifest.json");
const FONT = join(ROOT, "scripts", "fonts", "Sora-Variable.ttf");

const MODEL = process.env.IMAGE_MODEL || "gpt-image-2.5-sunburst";
const QUALITY = process.env.IMAGE_QUALITY || "high";
const CONCURRENCY = 3;
const MAX_RETRIES = 4;
// Tabela de preço (USD por 1M tokens) — mesma do GPT Image 2; usada só para estimativa.
const PRICE = { textIn: 5, imageIn: 8, imageOut: 30 };

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const FORCE = flag("force");
const ONLY = opt("only")?.split(",").filter(Boolean);
const GROUP = opt("group");
const COMPOSE_ONLY = flag("compose-only");

// ---------------------------------------------------------------- direção de arte
const BRAND =
  "Brand art direction: premium Brazilian uniform manufacturer. Palette navy #0b2545, blue #1d5fd1, cyan #13b5d6 and warm gold #e8ac2c accents. " +
  "Soft diffused studio lighting, crisp fabric texture, realistic stitching, clean and modern, professional commercial photography, high dynamic range, sharp focus.";
const NO_TEXT =
  "Absolutely no text, no letters, no numbers, no words, no watermarks, no brand logos or trademarks of any existing company anywhere in the image, no visible labels or hang tags.";
const PEOPLE =
  "Natural, diverse Brazilian people with realistic faces, natural relaxed hands with correct anatomy (five fingers), genuine friendly expressions, not looking like stock clichés.";

const PACKSHOT =
  "Premium e-commerce packshot, single garment shown alone on an invisible ghost mannequin (no person, no hanger), front view, perfectly centered, " +
  "the entire garment fully visible with generous even margin on all sides, occupying about 78% of the frame height. " +
  "Seamless light neutral background in very soft cool grey #eef1f5 with a subtle soft contact shadow below. " +
  "Soft diffused studio lighting from the upper left, true-to-life color, crisp fabric texture, realistic seams and stitching, catalog consistency. " +
  "Plain chest with no print or embroidery unless described.";

const product = (id, garment) => ({
  id,
  group: "products",
  out: `images/products/${id}.webp`,
  size: "1024x1024",
  final: [1024, 1024],
  prompt: `${PACKSHOT}\n\nGarment: ${garment}\n\n${NO_TEXT}`,
});

const CATEGORY_BG =
  "Vertical 4:5 brand card artwork. Background: smooth diagonal gradient from deep navy #0b2545 (top) to royal blue #1d5fd1 (bottom), " +
  "with a very subtle geometric pattern of thin diagonal lines and small dots in cyan #13b5d6 at low opacity, and a thin elegant gold #e8ac2c curved accent line. " +
  "The product floats in the UPPER-CENTER area with a soft realistic drop shadow and gentle rim light; the whole product (including any accessories) " +
  "must fit inside the top 60% of the card — its lowest point must stay above 62% of the card height, with nothing below it. " +
  "The BOTTOM 38% of the card must be calm, completely empty gradient background (reserved for a title added later). Premium, consistent series look.";

const category = (id, name, subject) => ({
  id: `cat-${id}`,
  group: "categories",
  out: `images/categories/${id}.webp`,
  base: `images/categories/_base/${id}.webp`,
  size: "1024x1280",
  final: [800, 1000],
  title: name,
  prompt: `${CATEGORY_BG}\n\nProduct: ${subject}\n\n${BRAND}\n\n${NO_TEXT}`,
});

const hero = (n, scene) => [
  {
    id: `hero-${n}`,
    group: "banners",
    out: `images/banners/hero-${n}.webp`,
    size: "2400x1008",
    final: [2400, 1000],
    prompt:
      `Ultra-wide cinematic website hero photograph (21:9). ${scene}\n\n` +
      "Composition: all subjects placed in the RIGHT 55% of the frame; the LEFT 45% is calm negative space " +
      "(softly out-of-focus background that gradually blends into deep navy #0b2545 at the far left edge) reserved for headline text added later. " +
      `\n\n${BRAND}\n${PEOPLE}\n${NO_TEXT}`,
  },
  {
    id: `hero-${n}-mobile`,
    group: "banners",
    out: `images/banners/hero-${n}-mobile.webp`,
    size: "1088x1360",
    final: [1080, 1350],
    prompt:
      `Vertical 4:5 mobile website hero photograph. ${scene}\n\n` +
      "Composition: subjects in the MIDDLE band of the frame; the TOP 28% and the BOTTOM 22% are calm, uncluttered areas " +
      "(soft background blending into deep navy #0b2545) reserved for text added later. " +
      `\n\n${BRAND}\n${PEOPLE}\n${NO_TEXT}`,
  },
];

const promo = (id, scene) => ({
  id,
  group: "banners",
  out: `images/banners/${id}.webp`,
  size: "1600x912",
  final: [1600, 900],
  prompt:
    `16:9 editorial promotional photograph for a website banner. ${scene}\n\n` +
    "Keep the left third relatively calm and uncluttered so overlaid text stays readable." +
    `\n\n${BRAND}\n${NO_TEXT}`,
});

// imagens de seção (páginas institucionais, home, sob medida, conta)
const section = (id, size, final, scene, extra = "") => ({
  id,
  group: "sections",
  out: `images/sections/${id}.webp`,
  size,
  final,
  prompt: `${scene}\n\n${extra}${BRAND}\n${NO_TEXT}`,
});
const segment = (id, scene) =>
  section(
    `segment-${id}`,
    "1088x1328",
    [900, 1100],
    `Vertical editorial portrait photograph for a uniform-segment card. ${scene} ` +
      "Uniforms are plain, clean and well-fitted, with at most a tiny abstract generic embroidered emblem (no letters). " +
      "Subject framed from the waist or knees up, centered, background softly blurred with navy and blue tones, lower 25% slightly darker and calm (a caption will be overlaid).",
    PEOPLE + "\n",
  );

// ---------------------------------------------------------------- jobs
const JOBS = [
  // Produtos — pronta-entrega (cor = primeira cor do produto)
  product("polo-pv-basica", "classic short-sleeve polo shirt in navy blue (#1b2a4a), lightweight smooth poly-viscose jersey knit with soft sheen, ribbed knit collar and ribbed sleeve cuffs, 3-button placket with matching navy buttons, straight hem. Men's regular fit."),
  product("polo-piquet-basica", "classic short-sleeve polo shirt in navy blue (#1b2a4a), 100% cotton piqué knit with clearly visible honeycomb piqué texture, ribbed collar, 3-button placket, short side vents at the hem. Men's regular fit, premium look."),
  product("polo-dry-fit-basica", "sporty short-sleeve polo shirt in navy blue (#1b2a4a), technical dry-fit polyamide performance fabric with fine micro-mesh texture and subtle sheen, flat knit collar, 3-button placket, modern athletic fit."),
  product("polo-piquet-feminina", "women's short-sleeve polo shirt in navy blue (#1b2a4a), cotton piqué with elastane, tailored fitted waist with feminine contour, shorter sleeves with fitted ribbed cuffs, 2-button placket, ribbed collar. Women's ghost mannequin."),
  product("camiseta-algodao-basica", "basic crew-neck short-sleeve t-shirt in clean white (#f6f6f3), soft 100% combed cotton jersey, ribbed crew neck, double-needle stitched hems, regular unisex fit. Make the white garment clearly separated from the light background with soft shading."),
  product("camiseta-dry-fit", "athletic crew-neck short-sleeve t-shirt in white (#f6f6f3), lightweight polyester dry-fit fabric with fine breathable micro-perforated texture, raglan sleeves, sporty regular fit. Make the white garment clearly separated from the light background with soft shading."),
  product("calca-brim-profissional", "professional work trousers in navy blue (#1b2a4a), heavy 100% cotton drill (twill) fabric with visible diagonal twill weave, waistband with elastic at the sides and belt loops, slanted front pockets, triple-stitched seams, straight leg, full length shown front view, ghost mannequin."),
  product("jaleco-gabardine", "women's long-sleeve medical lab coat in white (#f6f6f3), structured gabardine with elastane, tailored fitted waist, notched lapel collar, front closure with discreet snap buttons, two lower patch pockets and one chest pocket, long sleeves with cuffs, length to mid-thigh. Make the white garment clearly separated from the light background with soft shading."),
  product("moletom-canguru", "pullover hoodie sweatshirt in black (#17191e), thick brushed fleece cotton blend, lined hood with flat drawcords, front kangaroo pocket, ribbed cuffs and ribbed waistband, regular unisex fit."),
  product("camisa-operacional-brim", "short-sleeve professional work shirt in navy blue (#1b2a4a), lightweight cotton drill twill, pointed shirt collar, full front button placket, two chest patch pockets with button flaps, pen slot on the left pocket, reinforced shoulder yoke, robust stitching."),
  product("dolma-chef", "professional chef jacket (dólmã) in white (#f6f6f3), oxford fabric with elastane, double-breasted front with two rows of discreet white snap buttons, mandarin stand collar, long sleeves, small thermometer pocket on the left sleeve. Make the white garment clearly separated from the light background with soft shading."),
  product("camiseta-alta-visibilidade", "high-visibility safety crew-neck t-shirt in fluorescent lime yellow (#c6e22a), breathable polyester, with two horizontal 5 cm silver-grey retroreflective tape stripes sewn around the torso and around both upper sleeves, regular fit."),
  // Produtos — sob medida (detalhes do acabamento)
  product("polo-com-friso", "short-sleeve piqué polo shirt in navy blue (#1b2a4a) with contrast tipping: the ribbed collar and both sleeve cuffs have two thin stripes (frisos) in warm gold (#e8ac2c) and white, 3-button placket. A tiny abstract generic embroidered emblem (simple geometric shape, no letters) on the left chest."),
  product("polo-bicolor", "short-sleeve polo shirt in heather grey melange (#a3a8ae) with color-block panels: navy blue (#1b2a4a) shoulder yokes extending over the top of the sleeves and navy side panels, navy ribbed collar, 3-button placket, modern two-tone design. A tiny abstract generic embroidered emblem (simple geometric shape, no letters) on the left chest."),
  product("polo-gola-personalizada", "short-sleeve premium piqué polo shirt in black (#17191e) with a contrasting solid red (#c8102e) ribbed collar and red sleeve cuffs, red buttons on the placket, elegant design."),
  product("polo-manga-longa", "long-sleeve piqué polo shirt in navy blue (#1b2a4a), ribbed collar, 3-button placket, long sleeves with ribbed cuffs, a horizontal silver-grey retroreflective tape band around each forearm, subtle reinforced elbow patches in the same navy."),
  product("polo-alta-visibilidade", "high-visibility safety polo shirt, two-tone: fluorescent lime yellow (#c6e22a) upper body and sleeves, charcoal grey (#4a4f57) lower body panel, grey collar, with horizontal silver-grey retroreflective tape stripes around the torso and around both sleeves, breathable dry-fit fabric, 3-button placket."),

  // Categorias (arte sem texto + nome composto com Sora)
  category("polos", "Polos", "a neatly presented navy blue piqué polo shirt on an invisible ghost mannequin, front view, slightly angled."),
  category("camisetas", "Camisetas", "a stack of three neatly folded crew-neck cotton t-shirts in white, cyan and royal blue, with one white t-shirt on an invisible ghost mannequin standing behind them."),
  category("calcas", "Calças", "a pair of navy blue cotton drill professional work trousers, neatly folded in half and standing upright, showing twill texture and triple stitching."),
  category("jalecos", "Jalecos", "an elegant white tailored gabardine lab coat on an invisible ghost mannequin with a stethoscope draped around the collar, front view."),
  category("moletons", "Moletons", "a heather grey and black pullover hoodie on an invisible ghost mannequin, kangaroo pocket and drawcords visible, cozy fleece texture."),
  category("operacional", "Uniforme Operacional", "a navy blue short-sleeve work shirt with button-flap chest pockets on an invisible ghost mannequin, with a white safety helmet and work gloves placed at its base."),
  category("alimenticia", "Área Alimentícia", "a white double-breasted chef jacket (dólmã) on an invisible ghost mannequin, with a black chef apron folded beside it."),
  category("alta-visibilidade", "Alta Visibilidade", "a fluorescent lime-yellow high-visibility safety t-shirt with silver retroreflective stripes on an invisible ghost mannequin, glowing reflective tape catching the light."),

  // Banners hero
  ...hero(1, "A confident corporate team of four Brazilian professionals (men and women) standing together in a bright modern office with glass and warm wood, all wearing matching plain navy blue piqué polo shirts with a tiny abstract generic gold embroidered emblem on the chest (no letters), smiling, ready-to-wear corporate uniform look."),
  ...hero(2, "Inside a clean, well-lit Brazilian garment factory: a skilled seamstress in a navy uniform operating an industrial sewing machine, sewing a navy polo shirt, with bolts of navy, blue and cyan fabric, measuring tape and neatly stacked finished uniforms nearby; tailor-made uniform production, craftsmanship and quality."),
  ...hero(3, "A joyful group of Brazilian volunteers at an outdoor community event / church gathering at golden hour, wearing matching plain crew-neck t-shirts in vibrant colors (royal blue, cyan, golden yellow and white) without any prints, hugging and smiling together, festive bokeh lights in the background."),

  // Promos 16:9
  promo("promo-empresas", "A professional Brazilian businesswoman and businessman in a modern reception area wearing matching navy polo shirts with a tiny abstract gold embroidered emblem, greeting a client with a warm smile; corporate uniforms for companies. Subjects positioned on the right side. " + PEOPLE),
  promo("promo-eventos", "Energetic Brazilian participants at an outdoor running / community event wearing matching bright cyan and royal blue dry-fit t-shirts without prints, high-fiving at the finish area, sunny daylight, motion and joy. Subjects positioned on the right side. " + PEOPLE),
  promo("promo-sob-medida", "Close-up overhead flat lay on a tailor's work table: navy and royal blue piqué fabric swatches, a polo collar with gold contrast tipping, color fabric swatch fan in navy, blue, cyan and gold, tailor's measuring tape, chalk, sharp scissors and a pattern paper sketch of a polo shirt; custom uniform design process. Main objects on the right two thirds."),
  promo("promo-kit-completo", "Premium product still life of a complete uniform kit neatly folded and stacked on a light stone surface with a navy backdrop: a navy piqué polo shirt, navy drill work trousers, a white lab coat and a grey hoodie, arranged in a tidy elegant composition, soft studio light, subtle geometric shadow pattern. Products positioned on the right two thirds."),

  // Login
  {
    id: "login",
    group: "banners",
    out: "images/banners/login.webp",
    size: "1088x1360",
    final: [1080, 1350],
    prompt:
      "Vertical 4:5 elegant macro photograph of textile craftsmanship: extreme close-up of an abstract geometric embroidery being stitched in shiny gold #e8ac2c and cyan #13b5d6 thread on deep navy #0b2545 piqué fabric, " +
      "with a sewing needle and spools of navy, blue and gold thread softly out of focus, rich fabric texture, shallow depth of field, moody premium lighting with soft highlights. " +
      `\n\n${BRAND}\n${NO_TEXT}`,
  },

  // Seções
  section("about-factory", "1600x1008", [1600, 1000],
    "Wide editorial photograph of a modern, bright Brazilian uniform factory floor: rows of industrial sewing machines operated by focused seamstresses in navy uniforms, " +
    "neatly stacked navy and blue polo shirts, large rolls of navy, royal blue and cyan fabric, clean organized space with natural daylight from large windows, depth of field.",
    PEOPLE + "\n"),
  section("how-1", "1216x912", [1200, 900],
    "Close-up lifestyle photograph over the shoulder of a Brazilian business owner at a light wooden desk browsing a uniform catalog on a tablet: the tablet screen shows a clean grid of polo shirt photos in different colors (no readable text), " +
    "with a physical fabric color swatch fan in navy, blue, cyan and gold next to it, coffee cup, soft morning light. Choosing model and colors.",
    PEOPLE + "\n"),
  section("how-2", "1216x912", [1200, 900],
    "Photograph of a graphic designer's workspace: a large monitor displaying a simple abstract geometric vector emblem (blue and gold shapes, no letters) placed on a navy polo shirt mockup in a design application with generic interface panels (no readable text), " +
    "the designer's hand on a mouse, a drawing tablet and pantone-style color swatches on the desk, modern studio with soft light. Sending the logo file.",
    PEOPLE + "\n"),
  section("how-3", "1216x912", [1200, 900],
    "Close-up photograph of a person's hands holding a smartphone showing a clean preview of a navy polo shirt mockup with a small abstract gold emblem on the chest, and a large green circular check-mark approval button below it (no readable text), " +
    "blurred modern office background in navy and blue tones. Approving the layout on the phone.",
    PEOPLE + "\n"),
  section("how-4", "1216x912", [1200, 900],
    "Photograph of neatly packed uniform orders ready for shipping: plain kraft cardboard boxes, one open box showing folded navy polo shirts in clear protective bags with tissue paper, " +
    "sealed boxes stacked on a clean workbench in a bright logistics area, a roll of packing tape, soft daylight. Plain boxes with no printed logos or labels."),
  segment("saude", "A Brazilian healthcare professional (nurse or doctor) wearing a tailored white lab coat over navy scrubs, stethoscope around the neck, in a bright modern clinic corridor."),
  segment("industria", "A Brazilian industrial worker wearing a navy drill work shirt with silver reflective tape, white safety helmet and safety glasses, inside a clean modern factory with machinery in soft focus."),
  segment("alimentacao", "A Brazilian chef wearing a white double-breasted chef jacket and black apron, arms relaxed, in a clean professional stainless-steel restaurant kitchen with warm light."),
  segment("educacao", "A friendly middle-aged Brazilian male teacher with short grey-streaked hair and glasses wearing a navy polo shirt, holding a few notebooks, in a bright modern school hallway with colorful but blurred background."),
  segment("igrejas", "A small group of three smiling Brazilian church volunteers wearing matching plain royal blue t-shirts, welcoming people at the entrance of a bright, simple modern church hall with warm light."),
  segment("eventos", "Two cheerful Brazilian event staff members wearing matching plain cyan t-shirts and lanyards with blank badges, at an outdoor festival or sports event with bokeh lights."),
  segment("comercio", "A young Brazilian man with short straight black hair (East Asian–Brazilian descent), a retail store attendant wearing a navy polo shirt, smiling behind the counter of a modern, well-organized shop with shelves in soft focus."),
  section("custom-hero", "2016x1104", [2000, 1100],
    "Wide overhead-angled photograph of a tailor's pattern-making table for custom uniforms: paper sewing patterns of a polo shirt, swatches of navy, royal blue, cyan and gold piqué fabric, " +
    "loose polo collars with contrast tipping, color sample cards, measuring tape, tailor's chalk and brass scissors, warm soft studio light. No mannequin, no people. Composition: ALL objects are placed on the RIGHT 60% of the frame; the LEFT 40% is only plain, calm dark wooden table surface fading into deep navy shadow, reserved for headline text."),
  section("quality-fabric", "1216x1216", [1200, 1200],
    "Extreme macro photograph of navy blue cotton piqué fabric showing the honeycomb knit texture in fine detail, with a crisp double-needle seam of perfect even stitches in matching thread, " +
    "and the edge of a ribbed polo collar with a thin gold tipping stripe, raking soft light revealing texture, shallow depth of field."),
  section("embroidery", "1216x1216", [1200, 1200],
    "Close-up photograph of an industrial embroidery machine head stitching an abstract geometric emblem (interlocking blue, cyan and gold shapes, no letters) onto a navy polo shirt held in an embroidery hoop, " +
    "colorful thread cones in the background softly blurred, needle in motion, precise detailed stitches, warm workshop light."),
  section("team-corporate", "1600x1008", [1600, 1000],
    "Editorial photograph of a diverse Brazilian corporate team of five professionals of different ages and ethnicities smiling together in a modern bright office, all wearing matching plain navy piqué polo shirts " +
    "with a tiny abstract gold embroidered emblem (no letters), relaxed natural poses, warm daylight.",
    PEOPLE + "\n"),
  section("cta-bg", "2400x912", [2400, 900],
    "Abstract premium background texture: deep navy #0b2545 surface with a subtle fine fabric/woven texture, a few elegant thin flowing gold #e8ac2c lines and very faint cyan geometric accents, " +
    "soft vignette, lots of calm space, no objects, suitable as a background behind white text."),
  section("catalog-hero", "2400x800", [2400, 800],
    "Ultra-wide studio photograph of a sleek metal clothing rack with a neat row of polo shirts on hangers in a color gradient (navy, royal blue, cyan, white, grey, black, red, golden yellow), " +
    "placed on the right half of the frame, against a clean light grey studio wall with a soft geometric shadow pattern; the left half is calm empty space for text. Hangers without labels."),
  section("account-bg", "1600x1008", [1600, 1000],
    "Abstract soft light background: very light cool white and pale blue textile pattern, gentle diagonal woven texture and faint geometric line pattern in pale cyan and a hint of soft gold, " +
    "airy, minimal, low contrast, calm, no objects, suitable as a subtle page background."),
];

// ---------------------------------------------------------------- utilidades
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

function loadManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST, "utf8"));
  } catch {
    return { generatedWith: MODEL, items: {} };
  }
}
let manifest = loadManifest();
const saveManifest = () => writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

function py(code, ...pyArgs) {
  const r = spawnSync("python3", ["-I", "-c", code, ...pyArgs], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`python falhou: ${r.stderr}`);
  return r.stdout;
}

// recorte "cover" centralizado + resize + WebP
const PY_CONVERT = `
import sys
from PIL import Image, ImageOps
src, dst, w, h = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
im = Image.open(src).convert("RGB")
im = ImageOps.fit(im, (w, h), Image.LANCZOS, centering=(0.5, 0.5))
im.save(dst, "WEBP", quality=82, method=6)
`;

// título da categoria com Sora (pílula de cor + nome), sobre a base sem texto
const PY_TITLE = `
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
src, dst, title, font_path = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
im = Image.open(src).convert("RGBA")
W, H = im.size
# escurece suavemente a base para leitura do texto
grad = Image.new("L", (1, H))
for y in range(H):
    t = max(0.0, (y - H * 0.55) / (H * 0.45))
    grad.putpixel((0, y), int(200 * t ** 1.4))
shade = Image.new("RGBA", (W, H), (8, 26, 54, 255))
shade.putalpha(grad.resize((W, H)))
im = Image.alpha_composite(im, shade)

def font(size, weight):
    f = ImageFont.truetype(font_path, size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f

pad = int(W * 0.08)
max_w = W - 2 * pad
size = int(W * 0.115)
words = title.split()
# quebra em até 2 linhas, reduz até caber
while True:
    f = font(size, 700)
    lines = [title]
    if f.getlength(title) > max_w and len(words) > 1:
        best = None
        for i in range(1, len(words)):
            a, b = " ".join(words[:i]), " ".join(words[i:])
            m = max(f.getlength(a), f.getlength(b))
            if best is None or m < best[0]:
                best = (m, [a, b])
        lines = best[1]
    if max(f.getlength(l) for l in lines) <= max_w or size < 30:
        break
    size -= 2

d = ImageDraw.Draw(im)
asc, desc = f.getmetrics()
lh = int((asc + desc) * 1.02)
bottom = H - int(H * 0.075)
y0 = bottom - lh * len(lines)
# filete dourado acima do título
bar_w, bar_h = int(W * 0.12), max(4, int(W * 0.011))
d.rounded_rectangle([pad, y0 - bar_h - int(W * 0.035), pad + bar_w, y0 - int(W * 0.035)], radius=bar_h // 2, fill=(232, 172, 44, 255))
# sombra suave do texto
sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(sh)
for i, l in enumerate(lines):
    sd.text((pad, y0 + i * lh + 3), l, font=f, fill=(0, 0, 0, 140))
sh = sh.filter(ImageFilter.GaussianBlur(6))
im = Image.alpha_composite(im, sh)
d = ImageDraw.Draw(im)
for i, l in enumerate(lines):
    d.text((pad, y0 + i * lh), l, font=f, fill=(255, 255, 255, 255))
im.convert("RGB").save(dst, "WEBP", quality=82, method=6)
`;

async function callApi(job) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY ausente (rode com --env-file=.env.local)");
  const body = {
    model: MODEL,
    prompt: job.prompt,
    size: job.size,
    quality: QUALITY,
    output_format: "png",
    background: "opaque",
    moderation: "auto",
    n: 1,
  };
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${json?.error?.message ?? "erro desconhecido"}`);
    err.retryable = res.status === 429 || res.status >= 500;
    throw err;
  }
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw Object.assign(new Error("resposta sem imagem"), { retryable: true });
  return { buffer: Buffer.from(b64, "base64"), usage: json.usage ?? null };
}

function estimateCost(usage) {
  if (!usage) return null;
  const d = usage.input_tokens_details ?? {};
  const textIn = d.text_tokens ?? usage.input_tokens ?? 0;
  const imageIn = d.image_tokens ?? 0;
  const out = usage.output_tokens ?? 0;
  return +((textIn * PRICE.textIn + imageIn * PRICE.imageIn + out * PRICE.imageOut) / 1e6).toFixed(4);
}

function composeTitle(job) {
  if (!existsSync(FONT)) throw new Error(`Fonte não encontrada: ${FONT}`);
  py(PY_TITLE, join(OUT, job.base), join(OUT, job.out), job.title, FONT);
}

async function runJob(job) {
  const outPath = join(OUT, job.out);
  if (COMPOSE_ONLY) {
    if (job.title && existsSync(join(OUT, job.base))) {
      composeTitle(job);
      log(`✓ ${job.id} (título recomposto)`);
    }
    return;
  }
  if (!FORCE && existsSync(outPath)) {
    log(`- ${job.id} já existe, pulando`);
    return;
  }
  const rawTarget = job.base ? join(OUT, job.base) : outPath;
  mkdirSync(dirname(rawTarget), { recursive: true });
  mkdirSync(dirname(outPath), { recursive: true });
  const png = rawTarget.replace(/\.webp$/, ".tmp.png");

  for (let attempt = 1; ; attempt++) {
    try {
      log(`→ ${job.id} (${job.size}, tentativa ${attempt})`);
      const t0 = Date.now();
      const { buffer, usage } = await callApi(job);
      writeFileSync(png, buffer);
      py(PY_CONVERT, png, rawTarget, String(job.final[0]), String(job.final[1]));
      unlinkSync(png);
      if (job.title) composeTitle(job);
      const cost = estimateCost(usage);
      manifest.items[job.id] = {
        id: job.id,
        file: "/" + job.out,
        ...(job.base ? { base: "/" + job.base, title: job.title } : {}),
        model: MODEL,
        quality: QUALITY,
        requestedSize: job.size,
        finalSize: `${job.final[0]}x${job.final[1]}`,
        prompt: job.prompt,
        usage,
        estimatedCostUsd: cost,
        generatedAt: new Date().toISOString(),
      };
      saveManifest();
      log(`✓ ${job.id} em ${((Date.now() - t0) / 1000).toFixed(0)}s${cost != null ? ` (~US$ ${cost})` : ""}`);
      return;
    } catch (e) {
      if (existsSync(png)) unlinkSync(png);
      if (attempt >= MAX_RETRIES || e.retryable === false) {
        log(`✗ ${job.id}: ${e.message}`);
        throw e;
      }
      const wait = 2000 * 2 ** (attempt - 1) + Math.random() * 1000;
      log(`! ${job.id}: ${e.message} — nova tentativa em ${(wait / 1000).toFixed(1)}s`);
      await sleep(wait);
    }
  }
}

async function main() {
  let jobs = JOBS;
  if (GROUP) jobs = jobs.filter((j) => j.group === GROUP);
  if (ONLY) jobs = jobs.filter((j) => ONLY.includes(j.id));
  if (flag("list")) {
    for (const j of jobs) console.log(`${j.id.padEnd(28)} ${j.group.padEnd(11)} ${j.size.padEnd(10)} -> /${j.out}`);
    return;
  }
  log(`modelo=${MODEL} qualidade=${QUALITY} jobs=${jobs.length}${FORCE ? " (force)" : ""}`);
  manifest.generatedWith = MODEL;

  const queue = [...jobs];
  const failures = [];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) {
        const job = queue.shift();
        try {
          await runJob(job);
        } catch {
          failures.push(job.id);
        }
      }
    }),
  );

  const total = Object.values(manifest.items).reduce((s, i) => s + (i.estimatedCostUsd ?? 0), 0);
  log(`fim. custo estimado acumulado no manifest: ~US$ ${total.toFixed(2)}`);
  if (failures.length) {
    log(`falhas: ${failures.join(", ")}`);
    process.exitCode = 1;
  }
}

main();
