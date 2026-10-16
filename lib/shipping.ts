// Frete via Frenet: montagem dos volumes e leitura da cotação (funções puras, testáveis).
// A chamada HTTP com o token fica em lib/frenet.ts (server-only).
import { getProduct } from "./catalog.ts";
import {
  FREE_SHIPPING_FROM,
  lineQuantity,
  type CartLine,
  type ShippingOption,
} from "./pricing.ts";

/** CEP de origem padrão: fábrica em Cajamar/SP (cadastro da conta Asaas). */
export const DEFAULT_SELLER_CEP = "07791842";

export const PICKUP: ShippingOption = {
  id: "retirada",
  label: "Retirar na fábrica",
  days: "Cajamar/SP · após a produção",
  price: 0,
};

/** Peso (kg) e altura dobrada (cm) por peça, por categoria. Comprimento × largura: 30 × 25 cm. */
const PACK: Record<string, [weight: number, height: number]> = {
  polos: [0.25, 3],
  camisetas: [0.18, 2],
  calcas: [0.45, 4],
  jalecos: [0.4, 4],
  moletons: [0.6, 6],
  operacional: [0.4, 4],
  alimenticia: [0.3, 3],
  "alta-visibilidade": [0.35, 3],
};

export type FrenetItem = {
  SKU: string;
  Category: string;
  Quantity: number;
  Weight: number;
  Height: number;
  Length: number;
  Width: number;
};

export function frenetItems(
  lines: Pick<CartLine, "slug" | "sizes">[],
): FrenetItem[] {
  return lines
    .map((l) => {
      const [Weight, Height] = PACK[getProduct(l.slug)?.category ?? ""] ?? [
        0.3, 3,
      ];
      return {
        SKU: l.slug,
        Category: "Vestuario",
        Quantity: lineQuantity(l),
        Weight,
        Height,
        Length: 30,
        Width: 25,
      };
    })
    .filter((i) => i.Quantity > 0);
}

export type FrenetService = {
  ServiceCode?: string;
  ServiceDescription?: string;
  Carrier?: string;
  ShippingPrice?: string | number;
  DeliveryTime?: string | number;
  Error?: boolean;
  Msg?: string;
};

const round = (n: number) => Math.round(n * 100) / 100;
const daysLabel = (n: number) =>
  `${n} ${n === 1 ? "dia útil" : "dias úteis"} após o envio`;

/**
 * Converte a cotação da Frenet em opções de frete: descarta serviços com erro, ordena pelo preço,
 * aplica frete grátis na opção mais barata a partir de FREE_SHIPPING_FROM e acrescenta a retirada.
 */
export function mapFrenetServices(
  services: FrenetService[] | undefined,
  subtotal: number,
  max = 4,
): ShippingOption[] {
  const seen = new Set<string>();
  const valid = (services ?? [])
    .filter((s) => !s.Error && s.ServiceCode && Number(s.ShippingPrice) > 0)
    .map((s) => {
      const days = Math.max(1, Math.round(Number(s.DeliveryTime) || 0));
      const desc = (s.ServiceDescription || "Entrega").trim();
      const carrier = s.Carrier?.trim() || undefined;
      return {
        id: `f-${String(s.ServiceCode).replace(/[^A-Za-z0-9_-]/g, "")}`,
        // "Correios Sedex", "Jadlog Package" (sem repetir a transportadora)
        label:
          carrier && !desc.toLowerCase().includes(carrier.toLowerCase())
            ? `${carrier} ${desc}`
            : desc,
        carrier,
        days: daysLabel(days),
        price: round(Number(s.ShippingPrice)),
      } satisfies ShippingOption;
    })
    .filter((o) => (seen.has(o.id) ? false : (seen.add(o.id), true)))
    .sort((a, b) => a.price - b.price)
    .slice(0, max);
  if (valid.length && subtotal >= FREE_SHIPPING_FROM)
    valid[0] = { ...valid[0], label: `${valid[0].label} — grátis`, price: 0 };
  return [...valid, PICKUP];
}
