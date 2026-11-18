// Anúncio editado pelo painel: validação e diferença em relação ao catálogo do código.
// Puro (sem Next nem banco) para rodar no navegador, nas server actions e nos testes.
import { z } from "zod";
import { colors, getCategory, type ListingFields, type Product, type Size, type Technique } from "./catalog.ts";
import { safeImage } from "./banners.ts";
import { EDITABLE_SPECS } from "./specs.ts";

export const SIZE_OPTIONS = ["PP", "P", "M", "G", "GG", "XG", "XGG", "G3", "G4", "G5", "G6", "G7", "G8"] as const satisfies readonly Size[];
export const TECHNIQUE_OPTIONS = ["Bordado", "Silk", "DTF", "Sublimação"] as const satisfies readonly Technique[];
export const POSITION_OPTIONS = ["frente", "costas", "manga"] as const;
const SPEC_KEYS = EDITABLE_SPECS.map((s) => s.key) as [string, ...string[]];

/** Preço da personalização do simulador: técnica → posição → R$ por peça. */
export const feesSchema = z.partialRecord(z.enum(TECHNIQUE_OPTIONS), z.partialRecord(z.enum(POSITION_OPTIONS), z.number().min(0, "Preço inválido.").max(999, "Preço muito alto.")));
/** Textos editados das linhas fixas da ficha técnica (vazio esconde a linha). */
const specsSchema = z.partialRecord(z.enum(SPEC_KEYS), z.string().trim().max(400, "Texto da ficha técnica muito longo (máx. 400)."));
const extraSpecsSchema = z
  .array(
    z.object({
      label: z.string().trim().min(1, "Dê um nome a cada linha extra da ficha técnica.").max(60, "Nome da linha muito longo (máx. 60)."),
      value: z.string().trim().min(1, "Preencha o texto de cada linha extra da ficha técnica.").max(400, "Texto da linha muito longo (máx. 400)."),
    }),
  )
  .max(12, "No máximo 12 linhas extras na ficha técnica.");

/** Fotos por anúncio (galeria). */
export const MAX_PHOTOS = 15;

const line = (label: string, max: number) => z.string().trim().max(max, `${label}: máximo de ${max} caracteres.`);
const unique = <T,>(list: T[]) => new Set(list).size === list.length;

/** Todos os campos do formulário "Editar anúncio" (a galeria e as fotos por cor são salvas à parte). */
export const listingFormSchema = z
  .object({
    name: line("Título", 90).min(3, "Informe o título do anúncio."),
    category: z.string().refine((c) => !!getCategory(c), "Escolha a categoria."),
    subtitle: line("Modelo", 80),
    description: line("Descrição", 1500).min(10, "Escreva a descrição do produto."),
    fabric: line("Tecido", 60).min(2, "Informe o tecido."),
    composition: line("Composição", 80),
    fabricNote: line("Observação do tecido", 80),
    highlights: z
      .array(z.object({ title: line("Destaque", 60).min(2, "Dê um título a cada destaque."), text: line("Texto do destaque", 200) }))
      .max(8, "No máximo 8 destaques."),
    sizeChart: z.array(line("Tamanho", 20).min(1)).min(1, "Informe a grade de tamanhos.").max(20, "No máximo 20 tamanhos na grade."),
    techniques: z.array(z.enum(TECHNIQUE_OPTIONS)).min(1, "Escolha ao menos uma técnica de personalização."),
    price: z.number().min(0).max(9999, "Preço muito alto."),
    compareAt: z.number().min(0).max(9999).nullable(),
    colors: z
      .array(z.string().refine((id) => colors.some((c) => c.id === id), "Cor inválida."))
      .min(1, "Escolha ao menos uma cor.")
      .max(100),
    sizes: z.array(z.enum(SIZE_OPTIONS)),
    specs: specsSchema,
    extraSpecs: extraSpecsSchema,
  })
  .superRefine((v, ctx) => {
    if (!unique(v.colors)) ctx.addIssue({ code: "custom", path: ["colors"], message: "Cor repetida." });
    if (!unique(v.techniques)) ctx.addIssue({ code: "custom", path: ["techniques"], message: "Técnica repetida." });
    if (!unique(v.sizes)) ctx.addIssue({ code: "custom", path: ["sizes"], message: "Tamanho repetido." });
    if (v.compareAt !== null && v.compareAt <= v.price)
      ctx.addIssue({ code: "custom", path: ["compareAt"], message: "O preço \"de\" precisa ser maior que o preço de venda." });
  });
export type ListingForm = z.infer<typeof listingFormSchema>;

/** Até 2 fotos de pessoa vestindo por cor (frente e costas); posição vazia = "". */
export const colorPhotosSchema = z.record(
  z.string().refine((id) => colors.some((c) => c.id === id)),
  z.array(z.string().refine((u) => !u || safeImage(u))).max(2),
);

/** Edição gravada no banco: só os campos alterados. */
export const listingOverrideSchema = z
  .object({
    name: z.string(),
    subtitle: z.string(),
    description: z.string(),
    fabric: z.string(),
    composition: z.string(),
    fabricNote: z.string(),
    highlights: z.array(z.object({ title: z.string(), text: z.string() })),
    sizeChart: z.array(z.string()).min(1),
    techniques: z.array(z.enum(TECHNIQUE_OPTIONS)).min(1),
    price: z.number().min(0),
    compareAt: z.number().nullable(),
    // cor que saiu da paleta não derruba o anúncio: só é ignorada
    colors: z.array(z.string()).transform((l) => l.filter((id) => colors.some((c) => c.id === id))).pipe(z.array(z.string()).min(1)),
    sizes: z.array(z.enum(SIZE_OPTIONS)),
    colorPhotos: colorPhotosSchema,
    // categoria que deixou de existir é ignorada ao aplicar (o anúncio volta para a do código)
    category: z.string().max(60),
    photos: z.array(z.string().refine(safeImage)).max(MAX_PHOTOS),
    specs: specsSchema,
    extraSpecs: extraSpecsSchema,
  })
  .partial();

/** Galeria do anúncio: fotos do site ou do Blob, de 1 a MAX_PHOTOS, sem repetir. */
export const galleryPhotosSchema = z
  .array(z.string().refine(safeImage, "Foto inválida."))
  .min(1, "O anúncio precisa de pelo menos uma foto (a capa).")
  .max(MAX_PHOTOS, `No máximo ${MAX_PHOTOS} fotos por anúncio.`)
  .refine(unique, "Foto repetida na galeria.");

/** Os campos editáveis de um produto, no formato do formulário. */
export function listingFieldsOf(p: Product): ListingFields {
  return {
    name: p.name,
    category: p.category,
    subtitle: p.subtitle,
    description: p.description,
    fabric: p.fabric,
    composition: p.composition,
    fabricNote: p.fabricNote,
    highlights: p.highlights.map((h) => ({ title: h.title, text: h.text })),
    sizeChart: [...p.sizeChart],
    techniques: [...p.techniques],
    price: p.price,
    compareAt: p.compareAt ?? null,
    colors: [...p.colors],
    sizes: [...p.sizes],
    photos: [...p.photos],
    specs: { ...(p.specs ?? {}) },
    extraSpecs: (p.extraSpecs ?? []).map((r) => ({ ...r })),
    colorPhotos: p.colorPhotos ?? {},
  };
}

/** Os campos do formulário (sem a galeria e as fotos por cor, que têm botões próprios). */
export function listingFormOf(p: Product): ListingForm {
  const { photos: _photos, colorPhotos: _colors, ...form } = listingFieldsOf(p);
  return form;
}

/** Só o que mudou em relação ao catálogo do código (o resto segue o código, inclusive correções futuras). */
const canon = (v: unknown): unknown =>
  typeof v === "string"
    ? v.trim()
    : Array.isArray(v)
      ? v.map(canon)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.keys(v)
              .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
              .sort()
              .map((k) => [k, canon((v as Record<string, unknown>)[k])]),
          )
        : v;

/**
 * Mesmo conteúdo? Ignora a ordem das chaves (o banco devolve os objetos com as chaves em outra
 * ordem) e espaço nas pontas dos textos (o servidor apara ao salvar).
 */
export const sameData = (a: unknown, b: unknown) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));

export function listingDiff(base: Partial<ListingFields>, next: Partial<ListingFields>): Partial<ListingFields> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(next)) if (v !== undefined && !sameData(v, base[k as keyof ListingFields])) out[k] = v;
  return out as Partial<ListingFields>;
}

/** Fotos por cor sem posições vazias e sem cores sem foto. */
export function cleanColorPhotos(map: Record<string, string[]>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [color, list] of Object.entries(map)) if (list.some(Boolean)) out[color] = [list[0] ?? "", list[1] ?? ""];
  return out;
}
