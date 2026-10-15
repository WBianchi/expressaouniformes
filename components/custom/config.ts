import { customOptions, customProducts, getColor, getProduct, type Size } from "@/lib/catalog";

export type Sleeve = "Curta" | "Longa" | "Raglan";
export type LogoPosition = "Peito esquerdo" | "Peito direito" | "Costas" | "Manga";
export const logoPositions: LogoPosition[] = ["Peito esquerdo", "Peito direito", "Costas", "Manga"];
export const sizes: Size[] = ["PP", "P", "M", "G", "GG", "XG", "XGG"];
export { CUSTOM_MIN_QTY as MIN_QTY } from "@/lib/quote";

export type Brief = {
  model: string; // slug do modelo ou "zero"
  fabric: string;
  collar: string;
  sleeve: Sleeve;
  cuff: string;
  friso: boolean;
  colors: { body: string; collar: string; sleeve: string; friso: string };
  extras: string[];
  logo: { name: string; dataUrl?: string } | null;
  positions: LogoPosition[];
  quantity: number;
  grade: Partial<Record<Size, number>>;
  deadline: string;
  deadlineDate: string;
  notes: string;
  company: { name: string; cnpj: string; contact: string; phone: string; email: string; city: string; uf: string };
};

export const fabricInfo: Record<string, string> = {
  Piquet: "Trama texturizada e encorpada. Visual elegante, ótimo para bordado.",
  PV: "Poliéster + viscose. Leve, macio e não amarrota com facilidade.",
  "Dry fit": "Secagem rápida e respirável, com proteção UV. Ideal para áreas externas.",
  Algodão: "Toque natural e confortável. Excelente recepção de estampa.",
  Brim: "Alta resistência para rotinas operacionais e industriais.",
  Gabardine: "Caimento estruturado que não amassa. Elegante para saúde e atendimento.",
};

export const collarInfo: Record<string, string> = {
  "Polo tradicional": "Gola de malha retilínea com abertura e botões.",
  "Polo com friso": "Gola polo com listras de contraste nas cores da marca.",
  "Gola careca": "Gola redonda em ribana, versátil e confortável.",
  "Gola V": "Decote em V, moderno e arejado.",
  "Gola padre": "Gola baixa em pé, visual sóbrio e contemporâneo.",
};

export const sleeveInfo: Record<Sleeve, string> = {
  Curta: "Clássica para o dia a dia.",
  Longa: "Proteção para áreas externas e climatizadas.",
  Raglan: "Costura diagonal até a gola, mais mobilidade.",
};

export const cuffInfo: Record<string, string> = {
  "Sem punho": "Barra simples na manga.",
  "Punho liso": "Ribana na cor da gola.",
  "Punho com friso": "Ribana com listra de contraste.",
};

export const extraInfo: Record<string, string> = {
  "Faixa refletiva": "Faixas de 5 cm no tronco (e nas mangas longas).",
  Bolso: "Bolso no peito, com acabamento reforçado.",
  "Botões personalizados": "Botões na cor do friso ou com gravação.",
  "Etiqueta própria": "Etiqueta de gola com a sua marca.",
  "Recorte bicolor": "Laterais na cor das mangas para um visual moderno.",
};

export const deadlines = ["Sem urgência", "Até 30 dias", "30 a 45 dias", "45 a 60 dias", "Data específica"];

export const defaultBrief: Brief = {
  model: "zero",
  fabric: "Piquet",
  collar: "Polo tradicional",
  sleeve: "Curta",
  cuff: "Punho liso",
  friso: false,
  colors: { body: "marinho", collar: "marinho", sleeve: "marinho", friso: "amarelo" },
  extras: [],
  logo: null,
  positions: ["Peito esquerdo"],
  quantity: 50,
  grade: {},
  deadline: "30 a 45 dias",
  deadlineDate: "",
  notes: "",
  company: { name: "", cnpj: "", contact: "", phone: "", email: "", city: "", uf: "" },
};

/** Ponto de partida de cada modelo base. */
export const modelPresets: Record<string, Partial<Brief>> = {
  zero: {
    fabric: "Algodão",
    collar: "Gola careca",
    sleeve: "Curta",
    cuff: "Sem punho",
    friso: false,
    colors: { body: "branco", collar: "branco", sleeve: "branco", friso: "marinho" },
    extras: [],
  },
  "polo-com-friso": {
    fabric: "Piquet",
    collar: "Polo com friso",
    sleeve: "Curta",
    cuff: "Punho com friso",
    friso: true,
    colors: { body: "marinho", collar: "marinho", sleeve: "marinho", friso: "laranja" },
    extras: [],
  },
  "polo-bicolor": {
    fabric: "PV",
    collar: "Polo tradicional",
    sleeve: "Raglan",
    cuff: "Punho liso",
    friso: false,
    colors: { body: "mescla", collar: "preto", sleeve: "preto", friso: "laranja" },
    extras: ["Recorte bicolor"],
  },
  "polo-gola-personalizada": {
    fabric: "Piquet",
    collar: "Polo tradicional",
    sleeve: "Curta",
    cuff: "Punho liso",
    friso: false,
    colors: { body: "preto", collar: "vermelho", sleeve: "preto", friso: "branco" },
    extras: ["Botões personalizados", "Etiqueta própria"],
  },
  "polo-manga-longa": {
    fabric: "Dry fit",
    collar: "Polo tradicional",
    sleeve: "Longa",
    cuff: "Punho liso",
    friso: false,
    colors: { body: "marinho", collar: "marinho", sleeve: "marinho", friso: "amarelo" },
    extras: ["Faixa refletiva"],
  },
  "polo-alta-visibilidade": {
    fabric: "Dry fit",
    collar: "Polo tradicional",
    sleeve: "Curta",
    cuff: "Punho liso",
    friso: false,
    colors: { body: "limao", collar: "chumbo", sleeve: "chumbo", friso: "chumbo" },
    extras: ["Faixa refletiva", "Recorte bicolor"],
  },
};

export const isModel = (slug: string | undefined | null): slug is string =>
  !!slug && (slug === "zero" || customProducts.some((p) => p.slug === slug));

export function applyModel(b: Brief, slug: string): Brief {
  const preset = modelPresets[slug] ?? {};
  return { ...b, ...preset, model: slug, colors: { ...b.colors, ...preset.colors } };
}

export const modelName = (slug: string) => (slug === "zero" ? "Começar do zero" : getProduct(slug)?.name ?? slug);
export const colorName = (id: string) => getColor(id)?.name ?? id;
export const colorHex = (id: string) => getColor(id)?.hex ?? "#888888";
export const gradeTotal = (g: Brief["grade"]) => Object.values(g).reduce<number>((a, b) => a + (b || 0), 0);

/** Distribuição típica de grade para uma quantidade total. */
export function suggestGrade(total: number): Brief["grade"] {
  const weights: Partial<Record<Size, number>> = { PP: 0.04, P: 0.16, M: 0.3, G: 0.28, GG: 0.14, XG: 0.06, XGG: 0.02 };
  const out: Brief["grade"] = {};
  let used = 0;
  for (const s of sizes) {
    const n = Math.floor(total * (weights[s] ?? 0));
    out[s] = n;
    used += n;
  }
  out.M = (out.M ?? 0) + (total - used);
  return out;
}

export const collarOptions = customOptions.collars;
export const fabricOptions = customOptions.fabrics;
export const cuffOptions = customOptions.cuffs;
export const sleeveOptions = customOptions.sleeves as Sleeve[];
export const extraOptions = customOptions.extras;

/** Texto do briefing (WhatsApp / copiar). */
export function briefingText(b: Brief) {
  const grade = sizes
    .filter((s) => (b.grade[s] ?? 0) > 0)
    .map((s) => `${s}: ${b.grade[s]}`)
    .join(" · ");
  const prazo = b.deadline === "Data específica" && b.deadlineDate ? `até ${b.deadlineDate.split("-").reverse().join("/")}` : b.deadline;
  const c = b.company;
  const lines = [
    "*Briefing — Produção sob medida*",
    "Olá! Montei meu uniforme no site e gostaria de um orçamento.",
    "",
    `*Modelo base:* ${modelName(b.model)}`,
    `*Tecido:* ${b.fabric}`,
    `*Gola:* ${b.collar}`,
    `*Mangas:* ${b.sleeve} · *Punho:* ${b.cuff}`,
    `*Friso:* ${b.friso ? `Sim, ${colorName(b.colors.friso)}` : "Sem friso"}`,
    `*Cores:* corpo ${colorName(b.colors.body)} · gola/punho ${colorName(b.colors.collar)} · mangas ${colorName(b.colors.sleeve)}`,
    `*Extras:* ${b.extras.length ? b.extras.join(", ") : "Nenhum"}`,
    `*Logo/arte:* ${b.logo ? `${b.logo.name} (vou anexar o arquivo nesta conversa)` : "Ainda não enviada"}`,
    `*Posições da logo:* ${b.positions.length ? b.positions.join(", ") : "A definir"}`,
    `*Quantidade:* ${b.quantity} peças`,
    `*Grade estimada:* ${grade || "A definir"}`,
    `*Prazo desejado:* ${prazo}`,
    b.notes.trim() ? `*Observações:* ${b.notes.trim()}` : "",
    "",
    "*Empresa*",
    `${c.name}${c.cnpj ? ` · CNPJ ${c.cnpj}` : ""}`,
    `Contato: ${c.contact} · ${c.phone}`,
    `E-mail: ${c.email}`,
    `Cidade: ${c.city}/${c.uf.toUpperCase()}`,
  ];
  return lines.filter((l, i) => l !== "" || lines[i - 1] !== "").join("\n");
}
