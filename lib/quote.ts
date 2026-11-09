// Mínimos de pedido dos dois caminhos de compra.
// • Pronta-entrega (site/simulador): a partir de STOCK_MIN_QTY peças.
// • Fabricação (consultor): a partir de CUSTOM_MIN_QTY peças.

export const CUSTOM_MIN_QTY = 30;
export const STOCK_MIN_QTY = 5;

export const employeeOptions = [
  { id: "ate-10", label: "Até 10" },
  { id: "11-30", label: "11 a 30" },
  { id: "31-100", label: "31 a 100" },
  { id: "100+", label: "Mais de 100" },
] as const;
