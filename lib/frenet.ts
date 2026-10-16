// Cotação de frete na Frenet (server-only). O token nunca vai ao navegador.
// POST https://api.frenet.com.br/shipping/quote · header `token`.
import "server-only";
import {
  quoteShipping,
  totals,
  type CartLine,
  type ShippingOption,
} from "./pricing";
import {
  DEFAULT_SELLER_CEP,
  PICKUP,
  frenetItems,
  mapFrenetServices,
  type FrenetService,
} from "./shipping";

export const frenetConfigured = () => !!process.env.FRENET_TOKEN?.trim();

type Result = {
  options: ShippingOption[];
  error?: string;
  source: "frenet" | "estimate";
};

// cache curto por instância: o checkout recalcula com o mesmo valor que o cliente viu
const cache = new Map<string, { at: number; result: Result }>();
const TTL = 15 * 60_000;

export async function quoteFreight(
  cep: string,
  lines: Pick<CartLine, "slug" | "sizes" | "positions" | "color">[],
): Promise<Result> {
  const recipient = cep.replace(/\D/g, "");
  const { subtotal, items } = totals(lines as CartLine[]);
  if (recipient.length !== 8)
    return { options: [], error: "CEP inválido.", source: "frenet" };

  const token = process.env.FRENET_TOKEN?.trim();
  if (!token)
    return {
      options: quoteShipping(recipient, subtotal, items) ?? [],
      source: "estimate",
    };

  const volumes = frenetItems(lines);
  const key = JSON.stringify([
    recipient,
    subtotal,
    volumes.map((v) => [v.SKU, v.Quantity]),
  ]);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.result;

  try {
    const res = await fetch("https://api.frenet.com.br/shipping/quote", {
      method: "POST",
      headers: {
        token,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        SellerCEP: (
          process.env.FRENET_SELLER_CEP || DEFAULT_SELLER_CEP
        ).replace(/\D/g, ""),
        RecipientCEP: recipient,
        ShipmentInvoiceValue: subtotal,
        ShippingServiceCode: null,
        RecipientCountry: "BR",
        ShippingItemArray: volumes,
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`frenet ${res.status}`);
    const data = (await res.json()) as {
      ShippingSevicesArray?: FrenetService[];
    };
    const options = mapFrenetServices(data.ShippingSevicesArray, subtotal);
    const result: Result =
      options.length > 1
        ? { options, source: "frenet" }
        : {
            options,
            source: "frenet",
            error:
              "Nenhuma transportadora atende este CEP para esse volume. Fale com a gente ou retire na fábrica.",
          };
    cache.set(key, { at: Date.now(), result });
    if (cache.size > 1000) cache.clear();
    return result;
  } catch (err) {
    console.error(
      `[frete] falha na Frenet: ${err instanceof Error ? err.message : "erro"}`,
    );
    return {
      options: [PICKUP],
      source: "frenet",
      error:
        "Não foi possível calcular o frete agora. Tente de novo em instantes.",
    };
  }
}
