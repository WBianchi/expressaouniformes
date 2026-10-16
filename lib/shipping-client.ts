// Consulta de frete pelo navegador (passa por /api/shipping; o token da Frenet fica no servidor).
import type { CartLine, ShippingOption } from "./pricing";

export type ShippingQuote = { options: ShippingOption[]; error?: string };

export async function fetchShippingQuote(cep: string, lines: CartLine[], signal?: AbortSignal): Promise<ShippingQuote> {
  const res = await fetch("/api/shipping", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cep, lines: lines.map(({ logo: _logo, ...l }) => l) }),
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as Partial<ShippingQuote>;
  if (!res.ok) return { options: [], error: data.error ?? "Não foi possível calcular o frete." };
  return { options: data.options ?? [], error: data.error };
}

/** Assinatura das linhas que afetam o frete (evita nova consulta quando só a logo muda). */
export const shippingSignature = (lines: CartLine[]) =>
  JSON.stringify(lines.map((l) => [l.slug, l.color, l.positions, l.sizes]));
