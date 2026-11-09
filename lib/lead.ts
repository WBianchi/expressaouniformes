// Validação do contato do questionário (cliente e servidor).
import { z } from "zod";
import { getProduct } from "./catalog.ts";
import { artTechniques, fabricOptions, qtyOptions } from "./qualify.ts";

const ids = <T extends readonly { id: string }[]>(list: T) => list.map((o) => o.id) as [T[number]["id"], ...T[number]["id"][]];

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10 && v.length <= 13, "Informe um WhatsApp com DDD."),
  email: z.union([z.literal(""), z.string().trim().email("E-mail inválido.").max(160)]).default(""),
  company: z.string().trim().max(160).default(""),
  product: z.string().refine((s) => !!getProduct(s), "Produto inválido."),
  qty: z.enum(ids(qtyOptions)),
  route: z.enum(["minimo", "loja", "fabrica"]),
  custom: z.boolean(),
  technique: z.union([z.literal(""), z.enum(ids(artTechniques))]).default(""),
  fabric: z.array(z.enum(ids(fabricOptions))).max(5).default([]),
  /** de onde veio: lp:<slug>, orcamento, utm_campaign… */
  source: z.string().trim().max(200).default(""),
  /** campo escondido: preenchido = robô */
  website: z.string().max(200).optional(),
});

export type LeadInput = z.input<typeof leadSchema>;
