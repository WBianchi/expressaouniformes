// Perguntas e respostas de cada produto (landing page e dados estruturados FAQPage).
// Geradas a partir dos dados do catálogo, para responder o que o comprador procura no Google.
import { getColor, inStock, type Product } from "./catalog.ts";
import { CUSTOM_MIN_QTY, STOCK_MIN_QTY } from "./quote.ts";

const list = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}` : (items[0] ?? ""));

export function productFaq(p: Product): { q: string; a: string }[] {
  const stock = inStock(p);
  const colorNames = p.colors.map((id) => getColor(id)?.name ?? id);
  return [
    {
      q: `Qual o pedido mínimo de ${p.name.toLowerCase()}?`,
      a: stock
        ? `Na pronta-entrega o mínimo é de ${STOCK_MIN_QTY} peças, podendo misturar tamanhos, e a compra é feita direto pelo site. A partir de ${CUSTOM_MIN_QTY} peças o pedido vira fabricação, com preço de fábrica pelo volume e todas as cores do catálogo.`
        : `Esta peça é fabricada a partir de ${CUSTOM_MIN_QTY} peças no pedido, podendo misturar tamanhos. Um consultor monta o orçamento com você.`,
    },
    {
      q: "Posso colocar a logo da minha empresa?",
      a: `Sim. A logo pode ser aplicada em ${list(p.techniques).toLowerCase()}, na frente, nas costas ou na manga, conforme a peça. Você vê uma prévia da logo na peça e aprova o layout antes da produção.`,
    },
    {
      q: `Qual o tecido e a composição?`,
      a: `${p.fabric}, ${p.composition}. ${p.fabricNote}.`,
    },
    {
      q: "Quais cores estão disponíveis?",
      a: `Para fabricação: ${list(colorNames)}.${p.colors.length > 1 ? ` São ${p.colors.length} cores.` : ""}`,
    },
    {
      q: "Quais tamanhos estão disponíveis?",
      a: `${list(p.sizeChart)}.`,
    },
    {
      q: "Dá para mudar tecido, gola ou botões?",
      a: `Sim, em pedidos de fabricação (a partir de ${CUSTOM_MIN_QTY} peças) é possível personalizar a peça: tecido, gola, botões, frisos e cores. Na pronta-entrega a peça é a padrão e a personalização é a da logo.`,
    },
    {
      q: "Vocês entregam para todo o Brasil?",
      a: "Sim. Somos a fábrica: produzimos, personalizamos e enviamos para todo o Brasil. O frete e o prazo aparecem no carrinho ou no orçamento.",
    },
  ];
}
