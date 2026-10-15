// Triagem do pedido de orçamento sob medida: só libera o consultor quando o
// pedido atende ao mínimo de fabricação; abaixo disso, direciona para a loja.

export const CUSTOM_MIN_QTY = 30;
export const STOCK_MIN_QTY = 5;

export const quantityOptions = [
  { id: "ate-29", label: "Menos de 30", min: 0 },
  { id: "30-49", label: "30 a 49", min: 30 },
  { id: "50-99", label: "50 a 99", min: 50 },
  { id: "100-299", label: "100 a 299", min: 100 },
  { id: "300+", label: "300 ou mais", min: 300 },
] as const;

export const employeeOptions = [
  { id: "ate-10", label: "Até 10" },
  { id: "11-30", label: "11 a 30" },
  { id: "31-100", label: "31 a 100" },
  { id: "100+", label: "Mais de 100" },
] as const;

export const customizationOptions = [
  "Logo da empresa",
  "Cores da marca",
  "Tecido específico",
  "Gola e punho personalizados",
  "Friso",
  "Refletivo, bolsos e extras",
  "Ainda não sei",
] as const;

export type QuoteAnswers = {
  quantity: (typeof quantityOptions)[number]["id"] | null;
  employees: (typeof employeeOptions)[number]["id"] | null;
  customizations: string[];
};

export const emptyAnswers: QuoteAnswers = { quantity: null, employees: null, customizations: [] };

export const isComplete = (a: QuoteAnswers) => !!a.quantity && !!a.employees && a.customizations.length > 0;

/** Pedido atende ao mínimo de fabricação sob medida? */
export function isEligible(a: QuoteAnswers) {
  const q = quantityOptions.find((o) => o.id === a.quantity);
  return !!q && q.min >= CUSTOM_MIN_QTY;
}

export function quoteMessage(a: QuoteAnswers) {
  const q = quantityOptions.find((o) => o.id === a.quantity)?.label ?? "-";
  const e = employeeOptions.find((o) => o.id === a.employees)?.label ?? "-";
  return [
    "Olá! Quero um orçamento de uniformes personalizados para a minha empresa.",
    "",
    `• Quantidade de peças: ${q}`,
    `• Funcionários: ${e}`,
    `• Personalizações: ${a.customizations.join(", ") || "-"}`,
  ].join("\n");
}
