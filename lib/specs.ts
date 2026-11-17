// Ficha técnica do produto (tabela da página e dados para o Google). Algumas linhas vêm dos
// campos do anúncio (tecido, cores, tamanhos…); as linhas de texto fixo podem ser editadas no
// painel (vazio esconde a linha) e o painel ainda pode acrescentar linhas extras.
import { getCategory, getColor, inStock, type Product } from "./catalog.ts";
import { fabricOptions } from "./qualify.ts";
import { CUSTOM_MIN_QTY, STOCK_MIN_QTY } from "./quote.ts";

const list = (items: readonly string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}` : (items[0] ?? ""));

/** Código de referência do produto (como o "código" dos marketplaces). */
export const productRef = (p: Pick<Product, "slug">) => `EU-${String(p.slug.split("").reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 100000, 7)).padStart(5, "0")}`;

function care(p: Pick<Product, "composition">) {
  const poly = /poli/i.test(p.composition) && !/algod/i.test(p.composition);
  return `${poly ? "Lavar em água fria (até 30 °C)" : "Lavar em água até 40 °C"}, do avesso. Secar à sombra, sem secadora. Passar em temperatura média, sem passar sobre bordado ou estampa. Não usar alvejante com cloro.`;
}

/** Linhas de texto fixo da ficha técnica (editáveis no painel), na ordem da tabela. */
export const EDITABLE_SPECS = [
  { key: "fabricante", label: "Fabricante" },
  { key: "posicoes", label: "Posições da logo" },
  { key: "personalizacao", label: "Personalização da peça" },
  { key: "minimo", label: "Pedido mínimo" },
  { key: "grade", label: "Grade" },
  { key: "disponibilidade", label: "Disponibilidade" },
  { key: "cuidados", label: "Cuidados" },
] as const;
export type SpecKey = (typeof EDITABLE_SPECS)[number]["key"];

/** Texto automático de cada linha fixa (o que aparece se o painel não editar). */
export function defaultSpecs(p: Product): Record<SpecKey, string> {
  const stock = inStock(p);
  return {
    fabricante: "Expressão Uniformes (fábrica própria)",
    posicoes: list(["frente", "costas", "manga"].filter((x) => !p.noPositions?.includes(x as never))),
    personalizacao: `${list(fabricOptions.map((o) => o.label.toLowerCase()))} (pedidos de fabricação)`,
    minimo: stock ? `${STOCK_MIN_QTY} peças na pronta-entrega · ${CUSTOM_MIN_QTY} peças na fabricação` : `${CUSTOM_MIN_QTY} peças`,
    grade: "Pode misturar tamanhos no mesmo pedido",
    disponibilidade: stock ? "Pronta-entrega e fabricação" : "Fabricação sob encomenda",
    cuidados: care(p),
  };
}

/** Ficha técnica em uma tabela única, como nos marketplaces (também vai para o Google em dados estruturados). */
export function specRows(p: Product): [string, string][] {
  const auto = defaultSpecs(p);
  const text = (key: SpecKey) => p.specs?.[key] ?? auto[key];
  const label = (key: SpecKey) => EDITABLE_SPECS.find((x) => x.key === key)!.label;
  const rows: [string, string][] = [
    [label("fabricante"), text("fabricante")],
    ["Código", productRef(p)],
    ["Produto", p.name],
    ["Modelo", p.subtitle],
    ["Categoria", getCategory(p.category)?.name ?? ""],
    ["Tecido", p.fabric],
    ["Composição", p.composition],
    ["Observação do tecido", p.fabricNote],
    ["Tamanhos disponíveis", p.sizeChart.join(", ")],
    [`Cores disponíveis (${p.colors.length})`, p.colors.map((id) => getColor(id)?.name ?? id).join(", ")],
    ...p.highlights.map((h): [string, string] => [h.title, h.text]),
    ["Personalização da logo", list(p.techniques)],
    ...(["posicoes", "personalizacao", "minimo", "grade", "disponibilidade", "cuidados"] as const).map((k): [string, string] => [label(k), text(k)]),
    ...(p.extraSpecs ?? []).map((r): [string, string] => [r.label, r.value]),
  ];
  // linha vazia não aparece (texto apagado no painel ou anúncio ainda incompleto)
  return rows.filter(([k, v]) => !!k.trim() && !!v.trim());
}
