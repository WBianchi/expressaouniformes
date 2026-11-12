// Catálogo oficial da Expressão Uniformes (PDF "CATALOGO EXPRESSAO", 2026).
// Fonte única para loja, landing pages, busca, páginas e preços.
// Dois modos de venda: "stock" (pronta-entrega + logo, compra no site, a partir de 5 peças)
// e "custom" (fabricação: entra no orçamento com consultor, a partir de 30 peças).

export type SaleKind = "stock" | "custom";
export type Size = "PP" | "P" | "M" | "G" | "GG" | "XG" | "XGG" | "G3" | "G4" | "G5" | "G6" | "G7" | "G8";
export type Technique = "DTF" | "Silk" | "Bordado" | "Sublimação";
export type Position = "frente" | "costas" | "manga";

export type Color = { id: string; name: string; hex: string };

export type Category = {
  slug: string;
  name: string;
  /** nome do ícone lucide-react */
  icon: string;
  description: string;
  image: string;
};

export type Highlight = { title: string; text: string };

export type Product = {
  slug: string;
  name: string;
  kind: SaleKind;
  category: string; // Category.slug
  /** modelo/gola, como no catálogo (ex.: "Gola careca ou gola V") */
  subtitle: string;
  /** preço unitário da peça lisa, em reais (somente stock) */
  price: number;
  compareAt?: number;
  minQty: number;
  /** cores disponíveis para fabricação (a primeira é a das fotos) */
  colors: string[]; // Color.id
  /** grade vendida no site (somente stock) */
  sizes: Size[];
  /** grade de fabricação, como no catálogo */
  sizeChart: string[];
  /** tecido (ex.: "Malha PV") */
  fabric: string;
  /** composição (ex.: "67% poliéster + 33% viscose") */
  composition: string;
  /** observação do tecido no catálogo (ex.: "Variação de tecido disponível") */
  fabricNote: string;
  short: string;
  description: string;
  features: string[];
  highlights: Highlight[];
  techniques: Technique[];
  /** posições de logo que não se aplicam à peça (ex.: avental frontal não tem costas) */
  noPositions?: Position[];
  badge?: string;
  rating: number;
  reviews: number;
  /** peças em estoque (stock); 0 = sem estoque, só por orçamento */
  stock?: number;
  /** a peça sozinha, de frente (simulador da logo) */
  image: string;
  /** a peça sozinha, de costas */
  back: string;
  /** a peça sozinha, de lado */
  side: string;
  /** modelo vestindo a peça: frente e costas */
  photos: string[];
  /** galeria completa da landing page: modelo frente, modelo costas, peça frente, costas e lado */
  gallery: string[];
};

const c = (id: string, name: string, hex: string): Color => ({ id, name, hex });

export const colors: Color[] = [
  c("branco", "Branco", "#f7f7f5"),
  c("preto", "Preto", "#17181c"),
  c("marinho", "Marinho", "#1c2a4a"),
  c("marinho-noite", "Marinho noite", "#141c33"),
  c("noite", "Noite", "#1a1f3a"),
  c("royal", "Azul royal", "#1f4fb5"),
  c("azul-bb", "Azul BB", "#a9cbe8"),
  c("rosa-bb", "Rosa BB", "#f4c6d3"),
  c("bege", "Bege", "#d9c7a7"),
  c("prata", "Prata", "#bfc3c7"),
  c("lilas", "Lilás", "#b9a3d6"),
  c("verde-agua", "Verde água", "#7fd1c3"),
  c("amarelo-ouro", "Amarelo ouro", "#f2b500"),
  c("celeste", "Celeste", "#6fa8dc"),
  c("chumbo", "Cinza chumbo", "#4a4f57"),
  c("grafite", "Grafite", "#3a3d42"),
  c("mescla", "Mescla", "#a3a8ae"),
  c("turquesa", "Turquesa", "#1aa7b8"),
  c("jade", "Jade", "#16a085"),
  c("laranja", "Laranja", "#f26a1b"),
  c("roxo", "Roxo", "#5b2a86"),
  c("petroleo", "Petróleo", "#1f4e5a"),
  c("marrom", "Marrom", "#6b4226"),
  c("fluorescente", "Amarelo fluorescente", "#d7f02a"),
  c("vinho", "Vinho", "#6e1a2e"),
  c("vermelho", "Vermelho", "#c8102e"),
  c("verde-bandeira", "Verde bandeira", "#137a3a"),
  c("verde-musgo", "Verde musgo", "#4b5d2e"),
  c("amarelo", "Amarelo", "#f6d02f"),
  c("areia", "Areia", "#d8c9a3"),
  c("pink", "Pink", "#e8417f"),
  c("cinza-prata", "Cinza prata", "#c8cbcf"),
  c("caqui", "Caqui", "#b5a47a"),
  c("amarelo-canario", "Amarelo canário", "#ffd400"),
  c("verde-petrobras", "Verde Petrobras", "#0a7d3b"),
  c("verde-hospitalar", "Verde hospitalar", "#2e8b7a"),
  c("azul-motorista", "Azul motorista", "#2a4d8f"),
  c("cinza-claro", "Cinza claro", "#b8bcc2"),
  c("gelo", "Gelo", "#e9ecee"),
  c("marrom-fossil", "Marrom fóssil", "#6b5a4e"),
  c("vermelho-licor", "Vermelho licor", "#8e1b2f"),
  c("laranja-juice", "Laranja juice", "#ff7a1a"),
  c("dark-blue", "Dark blue", "#18233d"),
  c("verde-amazonas", "Verde Amazonas", "#1e6b4f"),
  c("cinza-titanium", "Cinza titanium", "#8a9097"),
  c("off-white", "Off white", "#f3efe6"),
  c("maisena", "Maisena", "#f3e7c9"),
  c("lunar", "Lunar", "#d6d9de"),
  c("uva", "Uva", "#6b3a6e"),
  c("silver", "Silver", "#c3c7cc"),
  c("ceu", "Céu", "#a7d3f0"),
  c("lime", "Lime", "#c9e06a"),
  c("acqua", "Acqua", "#8fd6d0"),
  c("placido", "Plácido", "#8fa7c4"),
  c("parisian", "Parisian", "#3b5b8c"),
  c("hortensia", "Hortênsia", "#7b8fd1"),
  c("cobalto", "Cobalto", "#1f3f9b"),
  c("solar", "Solar", "#ffcf3f"),
  c("abobora", "Abóbora", "#e8742a"),
  c("cereja", "Cereja", "#9b1b30"),
  c("ocre", "Ocre", "#c48a2c"),
  c("denin", "Denin", "#3a5a80"),
  c("militar", "Militar", "#4f5a3a"),
  c("mescla-off", "Mescla off", "#c9c5bd"),
  c("purist-blue", "Purist blue", "#2f6fd6"),
  c("neo-mint", "Neo mint", "#9fe3c4"),
  c("chiclete", "Chiclete", "#f39ac0"),
  c("rosa-quartzo", "Rosa quartzo", "#e8b8c4"),
  c("safari", "Safari", "#c9b38a"),
];

// cores de fabricação por tecido, como no catálogo
const PV = ["branco", "azul-bb", "rosa-bb", "bege", "prata", "lilas", "verde-agua", "amarelo-ouro", "celeste", "chumbo", "grafite", "mescla", "preto", "turquesa", "jade", "marinho", "noite", "laranja", "roxo", "petroleo", "marrom", "royal", "fluorescente", "vinho", "vermelho", "verde-bandeira", "verde-musgo"];
const PIQUET = ["branco", "mescla", "amarelo", "areia", "azul-bb", "rosa-bb", "chumbo", "grafite", "preto", "marinho", "laranja", "pink", "turquesa", "royal", "verde-bandeira", "verde-musgo", "vermelho", "vinho", "roxo", "noite", "cinza-prata"];
const BRIM = ["branco", "bege", "fluorescente", "caqui", "verde-bandeira", "amarelo-ouro", "amarelo-canario", "laranja", "vermelho", "marrom", "verde-agua", "verde-petrobras", "verde-hospitalar", "royal", "azul-motorista", "marinho", "marinho-noite", "cinza-claro", "chumbo", "petroleo", "preto"];
const OXFORD = ["branco", "gelo", "marrom-fossil", "preto", "verde-bandeira", "vermelho-licor", "amarelo-canario", "laranja-juice", "dark-blue", "marinho-noite", "royal", "verde-amazonas", "cinza-titanium", "grafite", "chumbo", "verde-hospitalar"];
const TRICOLINE = ["branco", "off-white", "maisena", "lunar", "rosa-bb", "uva", "lilas", "silver", "ceu", "lime", "acqua", "grafite", "placido", "parisian", "hortensia", "cobalto", "solar", "abobora", "cereja", "noite", "bege", "ocre", "verde-bandeira", "denin", "militar", "preto"];
const MOLETOM = ["preto", "grafite", "mescla", "mescla-off", "branco", "off-white", "marinho", "royal", "purist-blue", "verde-musgo", "verde-bandeira", "neo-mint", "vinho", "vermelho", "pink", "chiclete", "rosa-quartzo", "lilas", "laranja", "amarelo-ouro", "safari"];
/** a cor das fotos vem primeiro */
const first = (id: string, list: string[]) => [id, ...list.filter((x) => x !== id)];

export const categories: Category[] = [
  { slug: "camisetas", name: "Camisetas", icon: "Shirt", description: "Malha PV leve e resistente, manga curta, manga longa e baby look.", image: "/images/categories/camisetas.webp" },
  { slug: "polos", name: "Polos", icon: "Shirt", description: "Piquet com gola polo e 2 botões, masculina e feminina.", image: "/images/categories/polos.webp" },
  { slug: "camisas", name: "Camisas Sociais", icon: "Shirt", description: "Tricoline 100% algodão para recepção, atendimento e escritório.", image: "/images/categories/camisas.webp" },
  { slug: "operacional", name: "Uniforme Operacional", icon: "HardHat", description: "Brim e oxford para indústria, oficina, limpeza e serviços gerais.", image: "/images/categories/operacional.webp" },
  { slug: "calcas", name: "Calças e Bermudas", icon: "Ruler", description: "Brim, jeans e oxford, com elástico total ou meio cós.", image: "/images/categories/calcas.webp" },
  { slug: "jalecos", name: "Jalecos e Saúde", icon: "Stethoscope", description: "Jalecos tradicionais e privativos para saúde e estética.", image: "/images/categories/jalecos.webp" },
  { slug: "moletons", name: "Moletons", icon: "CloudSun", description: "Blusa moletom e canguru com capuz para os dias frios.", image: "/images/categories/moletons.webp" },
  { slug: "alimenticia", name: "Aventais", icon: "ChefHat", description: "Aventais bata e frontal para cozinha, limpeza e atendimento.", image: "/images/categories/alimenticia.webp" },
  { slug: "alta-visibilidade", name: "Alta Visibilidade", icon: "TriangleAlert", description: "Colete com faixas refletivas para transporte e logística.", image: "/images/categories/alta-visibilidade.webp" },
];

const PADRAO = ["PP", "P", "M", "G", "GG", "XG", "XGG", "G3", "G4", "G5", "G6", "G7", "G8"];
const ATE_XGG = ["PP", "P", "M", "G", "GG", "XG", "XGG"];
const SOCIAL = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const JEANS = ["40", "42", "44", "46", "48", "50", "52", "54", "56", "58"];
const UNICO = ["Tamanho único"];

const img = (slug: string) => `/images/products/${slug}.webp`;
const back = (slug: string) => `/images/products/${slug}-costas.webp`;
const side = (slug: string) => `/images/products/${slug}-lado.webp`;
const photos = (slug: string) => [1, 2].map((n) => `/images/products/${slug}-modelo-${n}.webp`);

type Base = Omit<Product, "image" | "back" | "side" | "photos" | "gallery" | "rating" | "reviews" | "features" | "short"> & { short?: string };

const COSTURA: Highlight = { title: "Costura reforçada", text: "Maior durabilidade e acabamento profissional." };
const GRAMATURA: Highlight = { title: "Alta gramatura", text: "Elevada gramatura do tecido." };
const DURABILIDADE: Highlight = { title: "Alta durabilidade", text: "Resistente ao uso contínuo e desgaste diário." };
const FECHAMENTO: Highlight = { title: "Fechamento prático", text: "Botões frontais que facilitam o uso e garantem ajuste seguro." };
const COBERTURA: Highlight = { title: "Cobertura total", text: "Comprimento alongado que amplia a proteção no dia a dia." };
const BOLSOS3: Highlight = { title: "Até 3 bolsos funcionais", text: "Mais praticidade para transportar itens essenciais durante a rotina." };
const PUNHO: Highlight = { title: "Punho com abotoamento", text: "Acabamento clássico que valoriza a apresentação e o ajuste da peça." };
const SOFISTICADO: Highlight = { title: "Altamente sofisticado", text: "Caimento alinhado que transmite mais profissionalismo e sofisticação." };
const REFORCO: Highlight = { title: "Reforço extra", text: "Opção de camada adicional no joelho para maior resistência ao desgaste." };
const BOLSOS_EXTRA: Highlight = { title: "Bolsos extra", text: "Bolsos laterais adicionais para melhor organização e acesso rápido aos itens essenciais." };
const MOBILIDADE: Highlight = { title: "Mobilidade garantida", text: "Liberdade de movimento durante toda a jornada." };

const ARTE: Technique[] = ["Bordado", "Silk", "DTF"];
const ARTE_SUB: Technique[] = ["Silk", "DTF", "Bordado", "Sublimação"];

const base: Base[] = [
  // ---------- camisetas ----------
  {
    slug: "camiseta-malha-pv", name: "Camiseta Malha PV Manga Curta", kind: "stock", category: "camisetas", subtitle: "Gola careca ou gola V",
    price: 24.9, compareAt: 29.9, minQty: 5, stock: 1500,
    colors: first("preto", PV), sizes: ["PP", "P", "M", "G", "GG", "XG", "XGG", "G3", "G4", "G5", "G6", "G7", "G8"], sizeChart: PADRAO,
    fabric: "Malha PV", composition: "67% poliéster + 33% viscose", fabricNote: "Variação de tecido disponível",
    description: "Leve e refrescante, com alto conforto térmico e excelente resistência. Baixa propensão a amassar, mantendo um visual alinhado ao longo do dia. Ideal para dias mais quentes.",
    highlights: [COSTURA], techniques: ARTE_SUB, badge: "Pronta-entrega",
  },
  {
    slug: "camiseta-malha-pv-manga-longa", name: "Camiseta Malha PV Manga Longa", kind: "stock", category: "camisetas", subtitle: "Gola careca ou gola V",
    price: 32.9, minQty: 5, stock: 800,
    colors: first("bege", PV), sizes: ["PP", "P", "M", "G", "GG", "XG", "XGG", "G3", "G4", "G5", "G6", "G7", "G8"], sizeChart: PADRAO,
    fabric: "Malha PV", composition: "67% poliéster + 33% viscose", fabricNote: "Variação de tecido disponível",
    description: "Confortável e resistente para o uso diário. Ideal para dias mais amenos, mantendo liberdade de movimento e ótimo caimento.",
    highlights: [{ title: "Proteção estendida", text: "Mangas longas que oferecem maior cobertura e conforto." }], techniques: ARTE_SUB, badge: "Pronta-entrega",
  },
  {
    slug: "camiseta-baby-look", name: "Camiseta Baby Look", kind: "custom", category: "camisetas", subtitle: "Gola careca ou gola V",
    price: 0, minQty: 30, colors: first("preto", PV), sizes: [], sizeChart: PADRAO,
    fabric: "Malha PV", composition: "67% poliéster + 33% viscose", fabricNote: "Variação de tecido disponível",
    description: "Modelagem ajustada, leve e confortável. Resistente, não amassa fácil e mantém bom caimento no uso diário.",
    highlights: [COSTURA], techniques: ARTE_SUB,
  },
  // ---------- polos ----------
  {
    slug: "polo-masculina-piquet", name: "Polo Masculina Piquet", kind: "custom", category: "polos", subtitle: "Gola polo + 2 botões",
    price: 0, minQty: 30, colors: first("marinho", PIQUET), sizes: [], sizeChart: PADRAO,
    fabric: "Malha piquet", composition: "50% poliéster + 50% algodão", fabricNote: "Variação de tecido disponível",
    description: "Visual mais alinhado e profissional. Em piquet, oferece maior estrutura, durabilidade e excelente caimento, ideal para ambientes profissionais e sociais.",
    highlights: [GRAMATURA], techniques: ARTE,
  },
  {
    slug: "polo-feminina-piquet", name: "Polo Feminina Piquet", kind: "custom", category: "polos", subtitle: "Gola polo + 2 botões",
    price: 0, minQty: 30, colors: first("marinho", PIQUET), sizes: [], sizeChart: PADRAO,
    fabric: "Malha piquet", composition: "50% poliéster + 50% algodão", fabricNote: "Variação de tecido disponível",
    description: "Ajuste ao corpo com visual elegante. Em piquet, garante estrutura, conforto e durabilidade para o dia a dia.",
    highlights: [GRAMATURA], techniques: ARTE,
  },
  // ---------- camisas sociais ----------
  {
    slug: "camisa-social-masculina", name: "Camisa Social Masculina Manga Curta", kind: "custom", category: "camisas", subtitle: "Botões + opção de bolsos",
    price: 0, minQty: 30, colors: first("ceu", TRICOLINE), sizes: [], sizeChart: SOCIAL,
    fabric: "Tecido tricoline", composition: "100% algodão", fabricNote: "Variação de tecido disponível",
    description: "Visual premium e acabamento alinhado. Confortável e ideal para ambientes profissionais e atendimento.",
    highlights: [SOFISTICADO], techniques: ["Bordado", "DTF"],
  },
  {
    slug: "camisa-social-masculina-manga-longa", name: "Camisa Social Masculina Manga Longa", kind: "custom", category: "camisas", subtitle: "Botões + opção de bolsos",
    price: 0, minQty: 30, colors: first("cobalto", TRICOLINE), sizes: [], sizeChart: SOCIAL,
    fabric: "Tecido tricoline", composition: "100% algodão", fabricNote: "Variação de tecido disponível",
    description: "Caimento alinhado e visual profissional. Ideal para empresas, recepção, atendimento e ambientes corporativos.",
    highlights: [PUNHO], techniques: ["Bordado", "DTF"],
  },
  {
    slug: "camisa-social-feminina", name: "Camisa Social Feminina Manga Curta", kind: "custom", category: "camisas", subtitle: "Botões + opção de bolsos",
    price: 0, minQty: 30, colors: first("noite", TRICOLINE), sizes: [], sizeChart: SOCIAL,
    fabric: "Tecido tricoline", composition: "100% algodão", fabricNote: "Variação de tecido disponível",
    description: "Visual premium e acabamento alinhado. Confortável e ideal para ambientes profissionais e atendimento.",
    highlights: [SOFISTICADO], techniques: ["Bordado", "DTF"],
  },
  {
    slug: "camisa-social-feminina-manga-longa", name: "Camisa Social Feminina Manga Longa", kind: "custom", category: "camisas", subtitle: "Botões + opção de bolsos",
    price: 0, minQty: 30, colors: first("noite", TRICOLINE), sizes: [], sizeChart: SOCIAL,
    fabric: "Tecido tricoline", composition: "100% algodão", fabricNote: "Variação de tecido disponível",
    description: "Visual premium e acabamento alinhado. Confortável e ideal para ambientes profissionais e atendimento.",
    highlights: [PUNHO], techniques: ["Bordado", "DTF"],
  },
  // ---------- operacional ----------
  {
    slug: "jaleco-gola-italiana", name: "Jaleco Gola Italiana Manga Curta", kind: "custom", category: "operacional", subtitle: "Gola italiana + 1 bolso",
    price: 0, minQty: 30, colors: first("chumbo", BRIM), sizes: [], sizeChart: PADRAO,
    fabric: "Brim leve", composition: "100% algodão", fabricNote: "Variação de composição disponível",
    description: "Ideal para indústrias, oficinas e serviços gerais, oferece alta respirabilidade, durabilidade e proteção contra sujeiras e abrasões leves.",
    highlights: [DURABILIDADE], techniques: ARTE,
  },
  {
    slug: "jaleco-gola-italiana-manga-longa", name: "Jaleco Gola Italiana Manga Longa", kind: "custom", category: "operacional", subtitle: "Gola italiana + 1 bolso",
    price: 0, minQty: 30, colors: first("chumbo", BRIM), sizes: [], sizeChart: PADRAO,
    fabric: "Brim leve", composition: "100% algodão", fabricNote: "Variação de composição disponível",
    description: "A definição de resistência, conforto e durabilidade. Ideal para indústrias, oficinas e serviços gerais, com maior taxa de proteção.",
    highlights: [DURABILIDADE], techniques: ARTE,
  },
  {
    slug: "jaleco-com-botoes", name: "Jaleco com Botões Manga Curta", kind: "custom", category: "operacional", subtitle: "Gola padrão + abertura",
    price: 0, minQty: 30, colors: first("chumbo", BRIM), sizes: [], sizeChart: PADRAO,
    fabric: "Brim leve", composition: "100% algodão", fabricNote: "Variação de composição disponível",
    description: "Leve, resistente e confortável. Fechamento frontal por botões, com ótimo caimento e praticidade para a rotina profissional.",
    highlights: [FECHAMENTO], techniques: ARTE,
  },
  {
    slug: "jaleco-com-botoes-manga-longa", name: "Jaleco com Botões Manga Longa", kind: "custom", category: "operacional", subtitle: "Gola padrão + 1 abertura",
    price: 0, minQty: 30, colors: first("chumbo", BRIM), sizes: [], sizeChart: PADRAO,
    fabric: "Brim leve", composition: "100% algodão", fabricNote: "Variação de composição disponível",
    description: "Feito para oferecer resistência e praticidade diariamente. O fechamento por botões proporciona um bom visual e facilita o vestir.",
    highlights: [FECHAMENTO], techniques: ARTE,
  },
  {
    slug: "jaleco-guarda-po", name: "Jaleco Guarda-Pó Manga Curta", kind: "custom", category: "operacional", subtitle: "Tamanho maior + abertura",
    price: 0, minQty: 30, colors: first("preto", BRIM), sizes: [], sizeChart: PADRAO,
    fabric: "Brim leve", composition: "100% algodão", fabricNote: "Variação de composição disponível",
    description: "Com maior comprimento para máxima cobertura. Resistente e confortável, ideal para proteção no uso profissional.",
    highlights: [COBERTURA], techniques: ARTE,
  },
  {
    slug: "jaleco-guarda-po-manga-longa", name: "Jaleco Guarda-Pó Manga Longa", kind: "custom", category: "operacional", subtitle: "Tamanho maior + abertura",
    price: 0, minQty: 30, colors: first("chumbo", BRIM), sizes: [], sizeChart: PADRAO,
    fabric: "Brim leve", composition: "100% algodão", fabricNote: "Variação de composição disponível",
    description: "Com maior comprimento para máxima cobertura. Resistente e confortável, ideal para proteção no uso profissional.",
    highlights: [COBERTURA], techniques: ARTE,
  },
  {
    slug: "jaleco-limpeza", name: "Jaleco para Limpeza", kind: "custom", category: "operacional", subtitle: "Bolsos adicionais",
    price: 0, minQty: 30, colors: first("marinho-noite", OXFORD), sizes: [], sizeChart: ATE_XGG,
    fabric: "Oxford", composition: "100% poliéster", fabricNote: "Variação de cores disponíveis",
    description: "Peça leve, ideal para equipes de limpeza e serviços gerais, oferecendo praticidade e caimento. Ideal para a rotina de trabalho.",
    highlights: [{ title: "Disponível em 2 cores", text: "Opções de cores para atender diferentes identidades da empresa." }], techniques: ARTE,
  },
  // ---------- calças e bermudas ----------
  {
    slug: "calca-brim-elastico-total", name: "Calça de Brim Elástico Total", kind: "stock", category: "calcas", subtitle: "4 bolsos + cordão",
    price: 69.9, minQty: 5, stock: 600,
    colors: first("chumbo", BRIM), sizes: ["PP", "P", "M", "G", "GG", "XG", "XGG", "G3", "G4", "G5", "G6", "G7", "G8"], sizeChart: PADRAO,
    fabric: "Brim pesado", composition: "100% algodão", fabricNote: "Variação de composição disponível",
    description: "Confortável e resistente para a rotina diária. Proporciona ótimo ajuste e liberdade de movimento.",
    highlights: [REFORCO, BOLSOS_EXTRA], techniques: ARTE, noPositions: ["manga"], badge: "Pronta-entrega",
  },
  {
    slug: "calca-meio-cos", name: "Calça Meio Cós", kind: "custom", category: "calcas", subtitle: "4 bolsos + passante + zíper",
    price: 0, minQty: 30, colors: first("chumbo", BRIM), sizes: [], sizeChart: PADRAO,
    fabric: "Brim pesado", composition: "100% algodão", fabricNote: "Variação de composição disponível",
    description: "Cós estruturado com elástico atrás, passantes para cinto e fechamento em zíper. Une visual profissional com conforto no ajuste.",
    highlights: [REFORCO, BOLSOS_EXTRA], techniques: ARTE, noPositions: ["manga"],
  },
  {
    slug: "calca-jeans", name: "Calça Jeans", kind: "custom", category: "calcas", subtitle: "4 bolsos + botão + zíper",
    price: 0, minQty: 30, colors: ["marinho"], sizes: [], sizeChart: JEANS,
    fabric: "Jeans", composition: "98% algodão + 2% elastano", fabricNote: "Cor marinho",
    description: "Versátil, com visual moderno e confortável para o dia a dia. Une resistência, praticidade e ótimo ajuste no uso profissional.",
    highlights: [{ title: "Tecido reforçado", text: "Jeans resistente ao desgaste diário, com excelente durabilidade." }], techniques: ["Bordado", "DTF"], noPositions: ["manga"],
  },
  {
    slug: "calca-oxford", name: "Calça Oxford", kind: "custom", category: "calcas", subtitle: "4 bolsos + cordão",
    price: 0, minQty: 30, colors: first("marinho-noite", OXFORD), sizes: [], sizeChart: PADRAO,
    fabric: "Oxford", composition: "100% poliéster", fabricNote: "Disponível também em gabardine",
    description: "Visual social e elegante, ideal para ambientes profissionais. Disponível também na opção gabardine, mais leve e confortável para o uso diário.",
    highlights: [{ title: "Visual refinado", text: "Modelagem social com ótimo caimento e acabamento alinhado." }], techniques: ["Bordado", "DTF"], noPositions: ["manga"],
  },
  {
    slug: "bermuda-elastico-total", name: "Bermuda Elástico Total", kind: "custom", category: "calcas", subtitle: "4 bolsos + elástico",
    price: 0, minQty: 30, colors: first("chumbo", BRIM), sizes: [], sizeChart: PADRAO,
    fabric: "Brim leve", composition: "100% algodão", fabricNote: "Variação de composição disponível",
    description: "Confortável e prática para o dia a dia. Modelagem leve que garante liberdade de movimento.",
    highlights: [{ title: "Ajuste flexível", text: "Cintura com elástico total para mais conforto e adaptação ao corpo." }], techniques: ARTE, noPositions: ["manga"],
  },
  {
    slug: "bermuda-meio-cos", name: "Bermuda Meio Cós", kind: "custom", category: "calcas", subtitle: "4 bolsos + passante + zíper",
    price: 0, minQty: 30, colors: first("chumbo", BRIM), sizes: [], sizeChart: PADRAO,
    fabric: "Brim leve", composition: "100% algodão", fabricNote: "Variação de composição disponível",
    description: "Cós estruturado com elástico atrás, passantes para cinto e fechamento em zíper. Une visual profissional com conforto no ajuste.",
    highlights: [{ title: "Passante na cintura", text: "Proporciona melhor ajuste ao corpo sem abrir mão do visual alinhado." }], techniques: ARTE, noPositions: ["manga"],
  },
  // ---------- jalecos e saúde ----------
  {
    slug: "jaleco-tradicional", name: "Jaleco Tradicional Manga Curta", kind: "custom", category: "jalecos", subtitle: "Bolsos + corda para amarrar",
    price: 0, minQty: 30, colors: first("branco", OXFORD), sizes: [], sizeChart: ATE_XGG,
    fabric: "Oxford", composition: "100% poliéster", fabricNote: "Variação de cores disponíveis",
    description: "Design clássico. Confeccionado para oferecer conforto, proteção e excelente apresentação em ambientes de cuidado e saúde.",
    highlights: [BOLSOS3], techniques: ["Bordado", "DTF"],
  },
  {
    slug: "jaleco-tradicional-manga-longa", name: "Jaleco Tradicional Manga Longa", kind: "custom", category: "jalecos", subtitle: "Bolsos + corda para amarrar",
    price: 0, minQty: 30, colors: first("branco", OXFORD), sizes: [], sizeChart: ATE_XGG,
    fabric: "Oxford", composition: "100% poliéster", fabricNote: "Variação de cores disponíveis",
    description: "Design clássico. Confeccionado para oferecer conforto, proteção e excelente apresentação em ambientes de cuidado e saúde.",
    highlights: [BOLSOS3], techniques: ["Bordado", "DTF"],
  },
  {
    slug: "jaleco-privativo", name: "Jaleco Privativo (Scrub)", kind: "custom", category: "jalecos", subtitle: "Scrubs + 2 bolsos",
    price: 0, minQty: 30, colors: first("marinho-noite", OXFORD), sizes: [], sizeChart: [...ATE_XGG, "G3"],
    fabric: "Oxford", composition: "100% poliéster", fabricNote: "Variação de cores disponíveis",
    description: "Modelo leve, confortável e respirável, ideal para médicos e profissionais da saúde. Desenvolvido para garantir liberdade de movimento durante longas jornadas.",
    highlights: [{ title: "Mobilidade garantida", text: "Design funcional que oferece conforto, mobilidade e praticidade no dia a dia." }], techniques: ["Bordado", "DTF"],
  },
  // ---------- moletons ----------
  {
    slug: "blusa-moletom", name: "Blusa Moletom", kind: "custom", category: "moletons", subtitle: "Com punho e gola",
    price: 0, minQty: 30, colors: first("branco", MOLETOM), sizes: [], sizeChart: PADRAO,
    fabric: "Moletom", composition: "50% poliéster + 50% algodão", fabricNote: "Variação de cores disponíveis",
    description: "Confortável e resistente, ideal para dias frios e uso diário. Ótimo caimento e sensação aconchegante.",
    highlights: [{ title: "Conforto térmico", text: "Mantém o corpo aquecido com toque macio e agradável." }], techniques: ["Silk", "DTF", "Bordado"],
  },
  {
    slug: "moletom-canguru", name: "Moletom Canguru", kind: "custom", category: "moletons", subtitle: "Com punho + capuz + bolso",
    price: 0, minQty: 30, colors: first("marinho", MOLETOM), sizes: [], sizeChart: PADRAO,
    fabric: "Moletom", composition: "50% poliéster + 50% algodão", fabricNote: "Variação de cores disponíveis",
    description: "Confortável e resistente para os dias mais frios. Conta com capuz e bolso frontal, unindo proteção térmica e praticidade.",
    highlights: [
      { title: "Incluso capuz", text: "Capuz para maior proteção contra o frio." },
      { title: "Bolso canguru", text: "Bolso frontal amplo para mais praticidade no dia a dia." },
    ],
    techniques: ["Silk", "DTF", "Bordado"],
  },
  // ---------- aventais ----------
  {
    slug: "avental-bata", name: "Avental Bata", kind: "custom", category: "alimenticia", subtitle: "2 bolsos + cordas",
    price: 0, minQty: 30, colors: first("preto", OXFORD), sizes: [], sizeChart: UNICO,
    fabric: "Oxford", composition: "100% poliéster", fabricNote: "Variação de cores disponíveis",
    description: "Modelo de avental curto e confortável. Oferece boa cobertura e praticidade para a rotina profissional.",
    highlights: [MOBILIDADE], techniques: ARTE, noPositions: ["manga"],
  },
  {
    slug: "avental-frontal", name: "Avental Frontal", kind: "custom", category: "alimenticia", subtitle: "Bolso largo + cordas",
    price: 0, minQty: 30, colors: first("preto", OXFORD), sizes: [], sizeChart: UNICO,
    fabric: "Oxford", composition: "100% poliéster", fabricNote: "Variação de cores disponíveis",
    description: "Maior cobertura, oferecendo mais proteção e um visual mais elegante. Ideal para rotinas que exigem praticidade e apresentação.",
    highlights: [{ title: "Bolso central", text: "Mais espaço para armazenar itens essenciais com praticidade." }], techniques: ARTE, noPositions: ["costas", "manga"],
  },
  // ---------- alta visibilidade ----------
  {
    slug: "colete-padrao", name: "Colete Padrão Refletivo", kind: "custom", category: "alta-visibilidade", subtitle: "Bolsos + zíper + faixa refletiva",
    price: 0, minQty: 30, colors: first("fluorescente", OXFORD.map((x) => (x === "amarelo-canario" ? "fluorescente" : x))), sizes: [], sizeChart: UNICO,
    fabric: "Poliéster", composition: "100% poliéster", fabricNote: "Variação de cores disponíveis",
    description: "Leve e funcional para operações de transporte, estoque e logística. Proporciona conforto e maior visibilidade durante o trabalho.",
    highlights: [{ title: "Faixas refletivas", text: "Aumentam a visibilidade do usuário em ambientes com pouca iluminação." }], techniques: ["DTF", "Silk"], noPositions: ["manga"],
  },
];

/** Ficha técnica em lista (vitrine, busca, landing page). */
const featuresOf = (p: Base) => [
  `${p.fabric} (${p.composition})`,
  p.subtitle,
  ...p.highlights.map((h) => h.title),
  `Tamanhos ${p.sizeChart.length > 1 ? `${p.sizeChart[0]} ao ${p.sizeChart[p.sizeChart.length - 1]}` : p.sizeChart[0].toLowerCase()}`,
];

export const products: Product[] = base.map((p) => ({
  ...p,
  short: p.short ?? `${p.subtitle}. ${p.fabric}, ${p.composition}.`,
  features: featuresOf(p),
  rating: 0,
  reviews: 0,
  image: img(p.slug),
  back: back(p.slug),
  side: side(p.slug),
  photos: photos(p.slug),
  gallery: [...photos(p.slug), img(p.slug), back(p.slug), side(p.slug)],
}));

export const stockProducts = products.filter((p) => p.kind === "stock");
export const customProducts = products.filter((p) => p.kind === "custom");

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
/** Compra online liberada: linha pronta-entrega com estoque. O resto só entra por orçamento. */
export const inStock = (p: Product) => p.kind === "stock" && (p.stock ?? 0) > 0;
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const getColor = (id: string) => colors.find((c) => c.id === id);

/** Personalização (pronta-entrega): taxa por posição de logo, por peça. */
export const positionFees: Record<Position, { label: string; fee: number }> = {
  frente: { label: "Frente (peito)", fee: 6.9 },
  costas: { label: "Costas", fee: 8.9 },
  manga: { label: "Manga", fee: 4.9 },
};

export const company = {
  name: "Expressão Uniformes",
  whatsapp: "5500000000000", // TODO: número oficial do cliente
  phone: "(00) 0000-0000",
  email: "contato@expressaouniformes.com.br",
  instagram: "https://instagram.com/expressaouniformes",
  address: "Endereço da fábrica — a confirmar",
  hours: "Seg. a sex., 8h às 18h",
};

export const whatsappLink = (text: string) =>
  `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(text)}`;

export const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

/** Cor (hex) para pintar a foto da peça; nula quando é a própria cor fotografada (a primeira). */
export const tintFor = (p: Pick<Product, "colors">, colorId: string | undefined): string | null =>
  !colorId || colorId === p.colors[0] ? null : (getColor(colorId)?.hex ?? null);
