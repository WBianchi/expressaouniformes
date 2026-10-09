import { money } from "@/lib/catalog";
import { FREE_SHIPPING_FROM } from "@/lib/pricing";

/** Perguntas da home (também usadas no JSON-LD FAQPage). */
export const faqs: { q: string; a: string }[] = [
  {
    q: "Qual é o pedido mínimo?",
    a: "Na linha pronta para personalizar, o mínimo é de 5 peças por modelo e cor, somando os tamanhos como preferir. Na produção sob medida, o mínimo é de 30 peças por modelo.",
  },
  {
    q: "Qual é o prazo de produção e entrega?",
    a: "Peças em estoque entram em produção logo após a aprovação do layout e costumam ficar prontas em poucos dias úteis. O prazo de entrega depende do frete escolhido e da sua região, e é exibido no carrinho ao informar o CEP. Na produção sob medida, o cronograma é combinado com o consultor.",
  },
  {
    q: "Como funciona a aprovação da arte?",
    a: "Depois do pagamento, nossa equipe monta o layout com a sua logo nas posições escolhidas. Você recebe um aviso e aprova (ou pede ajustes) direto no site, em Minha conta › Pedidos. A produção só começa após a sua aprovação.",
  },
  {
    q: "Quais são as formas de pagamento?",
    a: "Os pagamentos são processados com segurança pelo Asaas: Pix com 5% de desconto, boleto bancário ou cartão de crédito em até 6x sem juros (parcela mínima de R$ 50).",
  },
  {
    q: "Vocês entregam para todo o Brasil? Quanto custa o frete?",
    a: `Sim. O frete é calculado pelo CEP no carrinho, com opções econômica e expressa, além de retirada na fábrica. Compras acima de ${money(FREE_SHIPPING_FROM)} têm frete econômico grátis.`,
  },
  {
    q: "Como funciona a produção sob medida?",
    a: "Você monta a peça no configurador (tecido, gola, punho, friso, mangas, cores e extras), informa a quantidade e envia o briefing. Um consultor continua o atendimento pelo WhatsApp com orçamento, amostra e cronograma.",
  },
  {
    q: "Quais técnicas de personalização vocês usam?",
    a: "Trabalhamos com bordado, DTF, silk e sublimação. Indicamos a melhor técnica conforme o tecido, a arte e a quantidade do pedido.",
  },
];
