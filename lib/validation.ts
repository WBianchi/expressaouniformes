import { z } from "zod";
import { colors, getProduct, inStock, type Size } from "./catalog.ts";

const sizeKeys = ["PP", "P", "M", "G", "GG", "XG", "XGG"] as const satisfies readonly Size[];
const count = z.number().int().min(0).max(9999);

export const cartLineSchema = z
  .object({
    id: z.string().min(1).max(64),
    slug: z.string(),
    color: z.string().refine((c) => colors.some((x) => x.id === c)),
    sizes: z.partialRecord(z.enum(sizeKeys), count),
    positions: z.array(z.enum(["frente", "costas", "manga"])).max(3),
    logo: z
      .object({
        name: z.string().max(200),
        thumb: z.string().max(300_000).refine((s) => s.startsWith("data:image/")),
      })
      .optional(),
    notes: z.string().max(1000).optional(),
  })
  .superRefine((l, ctx) => {
    const p = getProduct(l.slug);
    if (!p || p.kind !== "stock") return ctx.addIssue({ code: "custom", message: "Produto indisponível." });
    if (!inStock(p)) return ctx.addIssue({ code: "custom", message: `${p.name} está sem estoque no momento. Inclua no orçamento.` });
    if (!p.colors.includes(l.color)) ctx.addIssue({ code: "custom", message: "Cor indisponível." });
    const qty = Object.values(l.sizes).reduce<number>((a, b) => a + (b || 0), 0);
    if (qty < p.minQty) ctx.addIssue({ code: "custom", message: `Mínimo de ${p.minQty} peças.` });
    for (const s of Object.keys(l.sizes) as Size[])
      if (!p.sizes.includes(s)) ctx.addIssue({ code: "custom", message: `Tamanho ${s} indisponível.` });
  });

export const localStoreSchema = z.object({
  cart: z.array(z.unknown()).max(50).default([]),
  favorites: z.array(z.string().refine((s) => !!getProduct(s))).max(100).default([]),
  coupon: z.string().max(40).nullable().default(null),
  cep: z.string().max(9).default(""),
});

export const addressSchema = z.object({
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  street: z.string().min(2, "Informe a rua"),
  number: z.string().min(1, "Número"),
  complement: z.string().optional(),
  district: z.string().min(2, "Informe o bairro"),
  city: z.string().min(2, "Informe a cidade"),
  state: z.string().length(2, "UF"),
});

export const customerSchema = z.object({
  type: z.enum(["pf", "pj"]),
  name: z.string().min(3, "Informe o nome completo"),
  company: z.string().optional(),
  document: z.string().refine((v) => [11, 14].includes(v.replace(/\D/g, "").length), "CPF/CNPJ inválido"),
  email: z.email("E-mail inválido"),
  phone: z.string().refine((v) => v.replace(/\D/g, "").length >= 10, "Telefone inválido"),
});
