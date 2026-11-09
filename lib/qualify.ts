// Qualificação do cliente (landing pages e "Solicitar orçamento"): quantidade, produto
// e personalização decidem o caminho.
// • Poucas peças (5 a 29): compra rápida no site, pelo simulador, sem vendedor.
// • 30 peças ou mais: fabricação, com atendimento de um consultor pelo WhatsApp.
// Personalização da ARTE do cliente (silk, bordado, DTF, sublimação) vale nos dois caminhos.
// Personalização da PEÇA (tecido, gola, botões, frisos, cores) é só da fabricação.
import { CUSTOM_MIN_QTY, STOCK_MIN_QTY } from "./quote.ts";

export const qtyOptions = [
  { id: "1-4", label: "1 a 4 peças", min: 1 },
  { id: "5-9", label: "5 a 9 peças", min: 5 },
  { id: "10-29", label: "10 a 29 peças", min: 10 },
  { id: "30-99", label: "30 a 99 peças", min: 30 },
  { id: "100-299", label: "100 a 299 peças", min: 100 },
  { id: "300+", label: "300 ou mais", min: 300 },
] as const;
export type QtyId = (typeof qtyOptions)[number]["id"];

/** Técnicas para aplicar a logo/arte do cliente na peça. */
export const artTechniques = [
  { id: "silk", label: "Silk", hint: "estampa durável, ótima para cores chapadas" },
  { id: "bordado", label: "Bordado", hint: "acabamento premium, ideal para polos e jalecos" },
  { id: "dtf", label: "DTF", hint: "arte colorida e com detalhes, sem limite de cores" },
  { id: "sublimacao", label: "Sublimação", hint: "arte na peça toda, para tecidos claros de poliéster" },
  { id: "nao-sei", label: "Não sei ainda", hint: "a gente indica a melhor para a sua arte" },
] as const;
export type ArtTechnique = (typeof artTechniques)[number]["id"];

/** Personalização da peça em si: só em pedidos de fabricação. */
export const fabricOptions = [
  { id: "tecido", label: "Tecido" },
  { id: "gola", label: "Gola" },
  { id: "botoes", label: "Botões" },
  { id: "frisos", label: "Frisos" },
  { id: "cores", label: "Cores e recortes" },
] as const;
export type FabricOption = (typeof fabricOptions)[number]["id"];

export type QualifyAnswers = {
  qty: QtyId | null;
  product: string | null;
  /** true = quer a logo/arte na peça */
  custom: boolean | null;
  technique: ArtTechnique | null;
  /** só fabricação */
  fabric: FabricOption[];
};

export const emptyQualify = (product: string | null = null): QualifyAnswers => ({
  qty: null,
  product,
  custom: null,
  technique: null,
  fabric: [],
});

export type Route = "minimo" | "loja" | "fabrica";

const qtyMin = (a: Pick<QualifyAnswers, "qty">) => qtyOptions.find((o) => o.id === a.qty)?.min ?? 0;

/** Caminho do cliente a partir da quantidade. */
export function routeFor(a: Pick<QualifyAnswers, "qty">): Route | null {
  if (!a.qty) return null;
  const min = qtyMin(a);
  if (min < STOCK_MIN_QTY) return "minimo";
  return min >= CUSTOM_MIN_QTY ? "fabrica" : "loja";
}

/** Respostas suficientes para mostrar o resultado. */
export function isQualified(a: QualifyAnswers) {
  if (!a.qty || !a.product || a.custom === null) return false;
  return !a.custom || !!a.technique;
}

export const techniqueLabel = (id: ArtTechnique | null) => artTechniques.find((t) => t.id === id)?.label ?? "";

/** Técnica do simulador (catálogo) correspondente à escolhida no questionário. */
export function toCatalogTechnique(id: ArtTechnique | null): "Silk" | "Bordado" | "DTF" | "Sublimação" | null {
  switch (id) {
    case "silk":
      return "Silk";
    case "bordado":
      return "Bordado";
    case "dtf":
      return "DTF";
    case "sublimacao":
      return "Sublimação";
    default:
      return null;
  }
}

/** Mensagem para o consultor (pedidos de fabricação). */
export function qualifyMessage(a: QualifyAnswers, productName: string, contact?: { name?: string; company?: string }) {
  const qty = qtyOptions.find((o) => o.id === a.qty)?.label ?? "-";
  const fabric = a.fabric.map((f) => fabricOptions.find((o) => o.id === f)?.label).filter(Boolean);
  return [
    "Olá! Quero um orçamento de uniformes direto da fábrica.",
    "",
    ...(contact?.name ? [`• Nome: ${contact.name}${contact.company ? ` (${contact.company})` : ""}`] : []),
    `• Produto: ${productName}`,
    `• Quantidade: ${qty}`,
    `• Logo/arte: ${a.custom ? techniqueLabel(a.technique) || "sim" : "sem personalização"}`,
    ...(fabric.length ? [`• Personalizar a peça: ${fabric.join(", ")}`] : []),
  ].join("\n");
}
