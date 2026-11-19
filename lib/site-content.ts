// Conteúdo da loja editado no painel (expressao.site_settings, uma linha por chave):
// - "benefits": barra de condições embaixo do banner da home (ícone + texto, ex.: "Compra 100% segura");
// - "account_banner": foto do banner de "Minha conta" (vazio = a foto padrão);
// - "category_rows": categorias da home em 1 ou 2 linhas.
// Sem banco, ou com um valor inválido gravado, vale o padrão daqui.
import { z } from "zod";
import { safeImage } from "./banners.ts";
import { money } from "./catalog.ts";
import { FREE_SHIPPING_FROM, PIX_DISCOUNT } from "./pricing.ts";

export const BENEFIT_ICONS = ["percent", "shield", "card", "truck", "factory", "clock", "award", "headset", "package", "shirt", "gift", "star"] as const;
export type BenefitIcon = (typeof BENEFIT_ICONS)[number];

/** Nome de cada ícone no painel. */
export const BENEFIT_ICON_LABELS: Record<BenefitIcon, string> = {
  percent: "Desconto (%)",
  shield: "Escudo (compra segura)",
  card: "Cartão",
  truck: "Caminhão (frete)",
  factory: "Fábrica",
  clock: "Relógio (prazo)",
  award: "Selo de qualidade",
  headset: "Atendimento",
  package: "Caixa (entrega)",
  shirt: "Camiseta",
  gift: "Presente",
  star: "Estrela",
};

export const BENEFITS_MAX = 6;
export const BENEFIT_TEXT_MAX = 48;

export const benefitsSchema = z.object({
  active: z.boolean(),
  items: z
    .array(
      z.object({
        icon: z.enum(BENEFIT_ICONS),
        text: z.string().trim().min(2, "Escreva o texto de cada item.").max(BENEFIT_TEXT_MAX, `Texto muito longo (máx. ${BENEFIT_TEXT_MAX}).`),
      }),
    )
    .max(BENEFITS_MAX, `No máximo ${BENEFITS_MAX} itens.`),
});
export type Benefits = z.infer<typeof benefitsSchema>;

export const defaultBenefits: Benefits = {
  active: true,
  items: [
    { icon: "percent", text: `${Math.round(PIX_DISCOUNT * 100)}% de desconto no Pix` },
    { icon: "shield", text: "Compra 100% segura" },
    { icon: "card", text: "Até 6x sem juros no cartão" },
    { icon: "truck", text: `Frete grátis acima de ${money(FREE_SHIPPING_FROM)}` },
  ],
};

export const ACCOUNT_BANNER_DEFAULT = "/images/sections/account-bg.webp";
export const accountBannerSchema = z.object({
  image: z
    .string()
    .trim()
    .refine((u) => !u || safeImage(u), "Imagem inválida."),
});

export const categoryRowsSchema = z.object({ rows: z.union([z.literal(1), z.literal(2)]) });
export type CategoryRows = z.infer<typeof categoryRowsSchema>["rows"];

export type SiteContent = {
  benefits: Benefits;
  /** foto enviada pelo painel; vazio = ACCOUNT_BANNER_DEFAULT */
  accountBanner: string;
  categoryRows: CategoryRows;
};

export const SITE_CONTENT_KEYS = ["benefits", "account_banner", "category_rows"] as const;

export const defaultSiteContent: SiteContent = { benefits: defaultBenefits, accountBanner: "", categoryRows: 1 };

/** Monta o conteúdo a partir das linhas gravadas (o que faltar ou estiver inválido fica no padrão). */
export function parseSiteContent(rows: { key: string; data: unknown }[]): SiteContent {
  const get = (k: (typeof SITE_CONTENT_KEYS)[number]) => rows.find((r) => r.key === k)?.data;
  const benefits = benefitsSchema.safeParse(get("benefits"));
  const banner = accountBannerSchema.safeParse(get("account_banner"));
  const cats = categoryRowsSchema.safeParse(get("category_rows"));
  return {
    benefits: benefits.success ? benefits.data : defaultBenefits,
    accountBanner: banner.success ? banner.data.image : "",
    categoryRows: cats.success ? cats.data.rows : 1,
  };
}
