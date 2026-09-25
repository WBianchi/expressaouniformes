export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  color: string;
  tag: string;
  description: string;
};
export const products: Product[] = [
  {
    id: "camiseta-essencial",
    name: "Camiseta Essencial",
    category: "Camisetas",
    price: 39.9,
    color: "#244e8a",
    tag: "MAIS VENDIDO",
    description:
      "Uma base versátil para vestir a identidade da sua equipe. Malha confortável, corte clássico e espaço para a sua marca.",
  },
  {
    id: "camiseta-premium",
    name: "Camiseta Premium",
    category: "Camisetas",
    price: 49.9,
    color: "#e5e1d8",
    tag: "NOVA COLEÇÃO",
    description:
      "Conforto no dia a dia e uma apresentação à altura da sua empresa. Personalize frente e costas.",
  },
  {
    id: "camiseta-operacional",
    name: "Camiseta Operacional",
    category: "Operacional",
    price: 44.9,
    color: "#35414b",
    tag: "PARA SUA EQUIPE",
    description:
      "Versatilidade para equipes em movimento. Uma proposta para operações, eventos e atendimento.",
  },
  {
    id: "camiseta-saude",
    name: "Camiseta Bem-estar",
    category: "Saúde",
    price: 42.9,
    color: "#65b7b6",
    tag: "PERSONALIZÁVEL",
    description:
      "Cores leves para equipes que cuidam. Crie uma composição com a identidade da sua clínica.",
  },
  {
    id: "camiseta-eventos",
    name: "Camiseta Conecta",
    category: "Eventos",
    price: 36.9,
    color: "#dfb641",
    tag: "PARA EVENTOS",
    description:
      "Sua equipe reconhecida em cada encontro. Uma base para campanhas e eventos corporativos.",
  },
  {
    id: "camiseta-gastronomia",
    name: "Camiseta Chef",
    category: "Gastronomia",
    price: 45.9,
    color: "#272c32",
    tag: "ESSENCIAL",
    description:
      "Uma presença discreta e profissional para o atendimento e a gastronomia.",
  },
];
export const categories = [
  "Todos",
  "Camisetas",
  "Operacional",
  "Saúde",
  "Eventos",
  "Gastronomia",
];
export const colors = [
  { name: "Azul-marinho", hex: "#244e8a" },
  { name: "Branco natural", hex: "#e5e1d8" },
  { name: "Preto", hex: "#272c32" },
  { name: "Azul-claro", hex: "#85badf" },
  { name: "Verde água", hex: "#65b7b6" },
  { name: "Amarelo", hex: "#dfb641" },
];
export const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n,
  );
export type Side = "front" | "back";
export type Design = {
  version: 1;
  productId: string;
  color: string;
  front: string;
  back: string;
  frontImage: string;
  backImage: string;
  sizes: Record<string, number>;
  technique: string;
};
export type CartItem = {
  id: string;
  productId: string;
  design: Design;
  quantity: number;
};
export function quantity(sizes: Record<string, number>) {
  return Object.values(sizes).reduce((a, b) => a + b, 0);
}
export const newDesign = (p: Product): Design => ({
  version: 1,
  productId: p.id,
  color: p.color,
  front: "",
  back: "",
  frontImage: "",
  backImage: "",
  sizes: { P: 5, M: 10, G: 10, GG: 5 },
  technique: "Silk",
});
