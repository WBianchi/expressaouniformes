import { z } from "zod";
import { products } from "./catalog.ts";
const count = z.number().int().min(0).max(9999);
export const designSchema = z.object({
  version: z.literal(1),
  productId: z.string().refine((id) => products.some((p) => p.id === id)),
  color: z.string().regex(/^#[a-fA-F0-9]{6}$/),
  front: z.string().max(12_000_000),
  back: z.string().max(12_000_000),
  frontImage: z
    .string()
    .max(12_000_000)
    .refine((s) => s === "" || s.startsWith("data:image/png;base64,")),
  backImage: z
    .string()
    .max(12_000_000)
    .refine((s) => s === "" || s.startsWith("data:image/png;base64,")),
  sizes: z.object({ P: count, M: count, G: count, GG: count }),
  technique: z.enum(["Silk", "Bordado", "Sublimação"]),
});
export const cartItemSchema = z
  .object({
    id: z.string().min(1),
    productId: z.string(),
    design: designSchema,
    quantity: z.number().int().min(30).max(39996),
  })
  .refine(
    (item) =>
      item.productId === item.design.productId &&
      item.quantity ===
        Object.values(item.design.sizes).reduce((sum, n) => sum + n, 0),
  );
export const localStoreSchema = z.object({
  cart: z.array(cartItemSchema).max(50).default([]),
  favorites: z
    .array(z.string().refine((id) => products.some((p) => p.id === id)))
    .max(50)
    .default([]),
});
