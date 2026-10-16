// Mensagem do pedido de orçamento ("Monte seu pedido") enviada ao consultor pelo WhatsApp.
import { getColor, getProduct, positionFees, type Position } from "./catalog.ts";
import { employeeOptions } from "./quote.ts";

export type QuoteCompany = {
  name: string;
  cnpj: string;
  contact: string;
  phone: string;
  email: string;
  city: string;
  employees: string;
  notes: string;
};

export const emptyCompany: QuoteCompany = { name: "", cnpj: "", contact: "", phone: "", email: "", city: "", employees: "", notes: "" };

const where = (positions: Position[]) =>
  positions.length ? `logo: ${positions.map((p) => positionFees[p].label.toLowerCase()).join(" + ")}` : "sem logo";

export function quoteRequestMessage(
  items: { slug: string; color: string; qty: number; positions: Position[] }[],
  c: QuoteCompany,
  logoName?: string,
) {
  const total = items.reduce((t, i) => t + i.qty, 0);
  const employees = employeeOptions.find((o) => o.id === c.employees)?.label;
  return [
    "Olá! Montei um pedido no site e quero um orçamento de uniformes.",
    "",
    `*Empresa:* ${c.name.trim()}${c.cnpj.trim() ? ` (CNPJ ${c.cnpj.trim()})` : ""}`,
    `*Responsável:* ${c.contact.trim()}`,
    `*Contato:* ${c.phone.trim()} · ${c.email.trim()}`,
    `*Cidade:* ${c.city.trim()}`,
    ...(employees ? [`*Funcionários:* ${employees}`] : []),
    "",
    `*Itens (${total} peças):*`,
    ...items.map((i) => {
      const p = getProduct(i.slug);
      return `• ${i.qty}x ${p?.name ?? i.slug} · ${getColor(i.color)?.name ?? i.color} · ${where(i.positions)}`;
    }),
    "",
    logoName ? `*Logo:* ${logoName} (envio o arquivo nesta conversa)` : "*Logo:* envio nesta conversa",
    ...(c.notes.trim() ? ["", `*Observações:* ${c.notes.trim()}`] : []),
  ].join("\n");
}
