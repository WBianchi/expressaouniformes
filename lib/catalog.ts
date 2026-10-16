// Catálogo demonstrativo. Fonte única para loja, busca, páginas e preços.
// Dois modos de venda: "stock" (pronta-entrega + logo, compra online) e "custom"
// (sob encomenda: entra no orçamento para empresas, a partir de 30 peças).

export type SaleKind = "stock" | "custom";
export type Size = "PP" | "P" | "M" | "G" | "GG" | "XG" | "XGG";
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

export type Product = {
  slug: string;
  name: string;
  kind: SaleKind;
  category: string; // Category.slug
  /** preço unitário da peça lisa, em reais (somente stock) */
  price: number;
  compareAt?: number;
  minQty: number;
  colors: string[]; // Color.id
  sizes: Size[];
  fabric: string;
  short: string;
  description: string;
  features: string[];
  techniques: Technique[];
  badge?: string;
  rating: number;
  reviews: number;
  /** peças em estoque (stock); 0 = sem estoque, só por orçamento */
  stock?: number;
  image: string;
  /** vista de costas, mesmo enquadramento da frontal (prévia da logo nas costas) */
  back: string;
  gallery: string[];
  /** fotos de vitrine com modelos (pessoas diferentes); o simulador usa image/back */
  photos: string[];
  /** custom: opções de acabamento destacadas */
  options?: string[];
};

export const colors: Color[] = [
  { id: "marinho", name: "Azul-marinho", hex: "#1b2a4a" },
  { id: "preto", name: "Preto", hex: "#17191e" },
  { id: "branco", name: "Branco", hex: "#f6f6f3" },
  { id: "mescla", name: "Cinza mescla", hex: "#a3a8ae" },
  { id: "chumbo", name: "Chumbo", hex: "#4a4f57" },
  { id: "royal", name: "Azul royal", hex: "#1f4fb5" },
  { id: "celeste", name: "Azul celeste", hex: "#8ec5ec" },
  { id: "vermelho", name: "Vermelho", hex: "#c8102e" },
  { id: "verde", name: "Verde bandeira", hex: "#137a3a" },
  { id: "amarelo", name: "Amarelo ouro", hex: "#f2b500" },
  { id: "laranja", name: "Laranja", hex: "#f26a1b" },
  { id: "limao", name: "Verde limão", hex: "#c6e22a" },
];

export const categories: Category[] = [
  { slug: "polos", name: "Polos", icon: "Shirt", description: "Apresentação impecável para o dia a dia da empresa.", image: "/images/categories/polos.webp" },
  { slug: "camisetas", name: "Camisetas", icon: "Shirt", description: "Básicas versáteis para equipes, eventos e igrejas.", image: "/images/categories/camisetas.webp" },
  { slug: "calcas", name: "Calças", icon: "Ruler", description: "Brim e sarja resistentes para a rotina operacional.", image: "/images/categories/calcas.webp" },
  { slug: "jalecos", name: "Jalecos", icon: "Stethoscope", description: "Elegância e conforto para saúde e estética.", image: "/images/categories/jalecos.webp" },
  { slug: "moletons", name: "Moletons", icon: "CloudSun", description: "Conforto térmico com a identidade da sua marca.", image: "/images/categories/moletons.webp" },
  { slug: "operacional", name: "Uniforme Operacional", icon: "HardHat", description: "Durabilidade para indústria, logística e campo.", image: "/images/categories/operacional.webp" },
  { slug: "alimenticia", name: "Área Alimentícia", icon: "ChefHat", description: "Dólmãs e peças para cozinhas e atendimento.", image: "/images/categories/alimenticia.webp" },
  { slug: "alta-visibilidade", name: "Alta Visibilidade", icon: "TriangleAlert", description: "Faixas refletivas e cores de segurança.", image: "/images/categories/alta-visibilidade.webp" },
];

const ADULT: Size[] = ["P", "M", "G", "GG", "XG"];
const img = (slug: string) => `/images/products/${slug}.webp`;
const back = (slug: string) => `/images/products/${slug}-costas.webp`;
const photos = (slug: string) => [1, 2].map((n) => `/images/products/${slug}-modelo-${n}.webp`);

const base: Omit<Product, "photos">[] = [
  // ---------- pronta-entrega ----------
  {
    slug: "polo-pv-basica", name: "Polo PV Básica", kind: "stock", category: "polos",
    price: 37.9, compareAt: 44.9, minQty: 5,
    colors: ["marinho", "preto", "mescla", "branco", "royal", "vermelho"], sizes: ADULT,
    fabric: "Poliéster + viscose", short: "Leve, confortável e ideal para uso corporativo.",
    description: "A polo que equilibra custo e apresentação. Malha PV com toque macio, gola e punho em ribana e caimento clássico que valoriza a sua marca bordada ou estampada.",
    features: ["Malha PV 67% poliéster / 33% viscose", "Gola e punho em ribana", "Não amarrota com facilidade", "Ideal para bordado no peito"],
    techniques: ["Bordado", "DTF", "Silk"], badge: "Mais vendida", rating: 4.8, reviews: 214, stock: 1240,
    image: img("polo-pv-basica"), back: back("polo-pv-basica"), gallery: [img("polo-pv-basica"), back("polo-pv-basica")],
  },
  {
    slug: "polo-piquet-basica", name: "Polo Piquet Básica", kind: "stock", category: "polos",
    price: 44.9, minQty: 5,
    colors: ["marinho", "preto", "mescla", "branco", "royal", "vermelho"], sizes: ADULT,
    fabric: "Piquet 100% algodão", short: "Visual mais elegante para o dia a dia da empresa.",
    description: "Trama piquet encorpada, com textura que transmite qualidade. A escolha certa para atendimento, recepção e equipes comerciais.",
    features: ["Piquet 100% algodão penteado", "Gola polo com 3 botões", "Barra com fenda lateral", "Excelente acabamento para bordado"],
    techniques: ["Bordado", "DTF"], badge: "Premium", rating: 4.9, reviews: 178, stock: 860,
    image: img("polo-piquet-basica"), back: back("polo-piquet-basica"), gallery: [img("polo-piquet-basica"), back("polo-piquet-basica")],
  },
  {
    slug: "polo-dry-fit-basica", name: "Polo Dry Fit Básica", kind: "stock", category: "polos",
    price: 42.9, minQty: 5,
    colors: ["marinho", "preto", "mescla", "branco", "royal"], sizes: ADULT,
    fabric: "Poliamida dry fit", short: "Secagem rápida e alta respirabilidade.",
    description: "Tecnologia que afasta o suor e seca rápido. Perfeita para equipes externas, eventos esportivos e climas quentes.",
    features: ["Tecido com proteção UV 30+", "Secagem rápida", "Antiodor", "Leve e respirável"],
    techniques: ["DTF", "Sublimação", "Bordado"], rating: 4.7, reviews: 96, stock: 0,
    image: img("polo-dry-fit-basica"), back: back("polo-dry-fit-basica"), gallery: [img("polo-dry-fit-basica"), back("polo-dry-fit-basica")],
  },
  {
    slug: "polo-piquet-feminina", name: "Polo Piquet Feminina", kind: "stock", category: "polos",
    price: 44.9, minQty: 5,
    colors: ["marinho", "preto", "mescla", "branco", "royal"], sizes: ["PP", "P", "M", "G", "GG"],
    fabric: "Piquet com elastano", short: "Modelagem feminina com ótimo caimento.",
    description: "Recortes acinturados e toque de elastano para conforto o dia inteiro, sem perder a elegância corporativa.",
    features: ["Modelagem acinturada", "Piquet com 4% elastano", "Manga com punho ajustado", "Gola com 2 botões"],
    techniques: ["Bordado", "DTF"], badge: "Novo", rating: 4.9, reviews: 64, stock: 0,
    image: img("polo-piquet-feminina"), back: back("polo-piquet-feminina"), gallery: [img("polo-piquet-feminina"), back("polo-piquet-feminina")],
  },
  {
    slug: "camiseta-algodao-basica", name: "Camiseta Algodão Básica", kind: "stock", category: "camisetas",
    price: 24.9, compareAt: 29.9, minQty: 5,
    colors: ["branco", "preto", "marinho", "mescla", "royal", "vermelho", "amarelo", "verde"], sizes: ["PP", ...ADULT, "XGG"],
    fabric: "Malha 100% algodão fio 30.1", short: "A queridinha de eventos, igrejas e equipes.",
    description: "Malha penteada fio 30.1, macia e com ótima recepção de estampa. Grade completa do PP ao XGG para vestir todo mundo.",
    features: ["100% algodão penteado fio 30.1", "Gola careca em ribana", "Costura dupla reforçada", "Ótima para DTF e silk"],
    techniques: ["DTF", "Silk"], badge: "Melhor preço", rating: 4.8, reviews: 532, stock: 3200,
    image: img("camiseta-algodao-basica"), back: back("camiseta-algodao-basica"), gallery: [img("camiseta-algodao-basica"), back("camiseta-algodao-basica")],
  },
  {
    slug: "camiseta-dry-fit", name: "Camiseta Dry Fit", kind: "stock", category: "camisetas",
    price: 29.9, minQty: 5,
    colors: ["branco", "preto", "marinho", "royal", "limao", "laranja"], sizes: ADULT,
    fabric: "Poliéster dry fit", short: "Para corridas, eventos esportivos e ações ao ar livre.",
    description: "Leve e respirável, com toque gelado. Aceita sublimação total e DTF com cores vivas.",
    features: ["100% poliéster com tecnologia dry", "Proteção UV", "Não desbota", "Ideal para sublimação"],
    techniques: ["Sublimação", "DTF"], rating: 4.7, reviews: 143, stock: 0,
    image: img("camiseta-dry-fit"), back: back("camiseta-dry-fit"), gallery: [img("camiseta-dry-fit"), back("camiseta-dry-fit")],
  },
  {
    slug: "calca-brim-profissional", name: "Calça Brim Profissional", kind: "stock", category: "calcas",
    price: 69.9, minQty: 5,
    colors: ["marinho", "preto", "chumbo"], sizes: ["P", "M", "G", "GG", "XG", "XGG"],
    fabric: "Brim 100% algodão 8,5 oz", short: "Resistência para a rotina mais pesada.",
    description: "Brim pesado com costuras triplas, cós com elástico lateral e bolsos reforçados. Feita para durar.",
    features: ["Brim 8,5 oz", "Elástico lateral no cós", "Bolsos faca e traseiro", "Costura tripla"],
    techniques: ["Bordado", "Silk"], rating: 4.6, reviews: 88, stock: 0,
    image: img("calca-brim-profissional"), back: back("calca-brim-profissional"), gallery: [img("calca-brim-profissional"), back("calca-brim-profissional")],
  },
  {
    slug: "jaleco-gabardine", name: "Jaleco Gabardine", kind: "stock", category: "jalecos",
    price: 89.9, minQty: 5,
    colors: ["branco", "marinho", "celeste"], sizes: ["PP", "P", "M", "G", "GG"],
    fabric: "Gabardine com elastano", short: "Elegância para clínicas, salões e laboratórios.",
    description: "Gabardine encorpado que não amassa, com modelagem acinturada e bolsos funcionais. Bordamos nome e logo.",
    features: ["Gabardine com 3% elastano", "Manga longa com punho", "3 bolsos", "Botões de pressão"],
    techniques: ["Bordado"], badge: "Saúde", rating: 4.9, reviews: 121, stock: 0,
    image: img("jaleco-gabardine"), back: back("jaleco-gabardine"), gallery: [img("jaleco-gabardine"), back("jaleco-gabardine")],
  },
  {
    slug: "moletom-canguru", name: "Moletom Canguru", kind: "stock", category: "moletons",
    price: 99.9, minQty: 5,
    colors: ["preto", "marinho", "mescla", "chumbo"], sizes: ADULT,
    fabric: "Moletom 3 cabos flanelado", short: "Conforto térmico com a sua marca em destaque.",
    description: "Moletom felpado por dentro, capuz forrado e bolso canguru. Perfeito para equipes, turmas e confraternizações.",
    features: ["Moletom 3 cabos 50/50", "Interior flanelado", "Capuz com cordão", "Punho e barra em ribana"],
    techniques: ["Bordado", "DTF", "Silk"], rating: 4.8, reviews: 77, stock: 0,
    image: img("moletom-canguru"), back: back("moletom-canguru"), gallery: [img("moletom-canguru"), back("moletom-canguru")],
  },
  {
    slug: "camisa-operacional-brim", name: "Camisa Operacional Brim", kind: "stock", category: "operacional",
    price: 64.9, minQty: 5,
    colors: ["marinho", "chumbo", "royal"], sizes: ["P", "M", "G", "GG", "XG", "XGG"],
    fabric: "Brim leve 100% algodão", short: "Robusta, prática e pronta para o campo.",
    description: "Camisa profissional com bolsos com lapela, reforço nos ombros e opção de faixa refletiva aplicada.",
    features: ["Brim leve 7 oz", "2 bolsos com lapela", "Porta-caneta", "Aceita faixa refletiva"],
    techniques: ["Bordado", "Silk"], rating: 4.6, reviews: 52, stock: 0,
    image: img("camisa-operacional-brim"), back: back("camisa-operacional-brim"), gallery: [img("camisa-operacional-brim"), back("camisa-operacional-brim")],
  },
  {
    slug: "dolma-chef", name: "Dólmã Chef", kind: "stock", category: "alimenticia",
    price: 79.9, minQty: 5,
    colors: ["branco", "preto"], sizes: ["PP", "P", "M", "G", "GG"],
    fabric: "Oxford com elastano", short: "Presença profissional para cozinha e atendimento.",
    description: "Dólmã transpassado com botões de pressão, tecido de fácil lavagem e bolso porta-termômetro.",
    features: ["Oxford com elastano", "Fechamento transpassado", "Bolso porta-termômetro", "Fácil lavagem"],
    techniques: ["Bordado"], rating: 4.8, reviews: 69, stock: 0,
    image: img("dolma-chef"), back: back("dolma-chef"), gallery: [img("dolma-chef"), back("dolma-chef")],
  },
  {
    slug: "camiseta-alta-visibilidade", name: "Camiseta Alta Visibilidade", kind: "stock", category: "alta-visibilidade",
    price: 39.9, minQty: 5,
    colors: ["limao", "laranja"], sizes: ADULT,
    fabric: "Poliéster fluorescente", short: "Segurança com faixas refletivas de 5 cm.",
    description: "Tecido fluorescente com faixas refletivas costuradas. Indicada para obras, logística e trânsito.",
    features: ["Faixas refletivas 5 cm", "Cores de alta visibilidade", "Tecido respirável", "Costura reforçada"],
    techniques: ["Silk", "DTF"], badge: "Segurança", rating: 4.7, reviews: 41, stock: 0,
    image: img("camiseta-alta-visibilidade"), back: back("camiseta-alta-visibilidade"), gallery: [img("camiseta-alta-visibilidade"), back("camiseta-alta-visibilidade")],
  },

  // ---------- sob encomenda (orçamento, 30+ peças) ----------
  {
    slug: "polo-com-friso", name: "Polo com Friso", kind: "custom", category: "polos",
    price: 0, minQty: 30, colors: ["marinho", "preto", "branco", "royal", "chumbo"], sizes: ADULT,
    fabric: "Piquet, PV ou dry fit", short: "Combinação de cores com frisos e gola diferenciada.",
    description: "Frisos na gola e no punho com as cores da sua marca. Escolha tecido, botões e acabamentos.",
    features: ["Frisos na gola e mangas", "Cores da sua identidade", "Escolha do tecido", "Bordado incluso no projeto"],
    techniques: ["Bordado", "DTF", "Silk"], rating: 4.9, reviews: 38,
    options: ["Friso", "Gola", "Punho", "Botões"], image: img("polo-com-friso"), back: back("polo-com-friso"), gallery: [img("polo-com-friso"), back("polo-com-friso")],
  },
  {
    slug: "polo-bicolor", name: "Polo Bicolor", kind: "custom", category: "polos",
    price: 0, minQty: 30, colors: ["mescla", "marinho", "preto", "branco"], sizes: ADULT,
    fabric: "Piquet ou PV", short: "Recortes com cores personalizadas.",
    description: "Recortes laterais e nos ombros em duas cores para um visual moderno e exclusivo.",
    features: ["Recortes em duas cores", "Modelagem exclusiva", "Combinação livre de cores", "Bordado e silk"],
    techniques: ["Bordado", "Silk"], rating: 4.8, reviews: 22,
    options: ["Recortes", "Cores", "Gola"], image: img("polo-bicolor"), back: back("polo-bicolor"), gallery: [img("polo-bicolor"), back("polo-bicolor")],
  },
  {
    slug: "polo-gola-personalizada", name: "Polo Gola Personalizada", kind: "custom", category: "polos",
    price: 0, minQty: 30, colors: ["preto", "marinho", "branco", "vermelho"], sizes: ADULT,
    fabric: "Piquet premium", short: "Escolha a cor da gola, punho e botões.",
    description: "Gola e punho em cor de contraste, botões personalizados e etiqueta com a sua marca.",
    features: ["Gola e punho contrastantes", "Botões personalizados", "Etiqueta própria", "Piquet premium"],
    techniques: ["Bordado"], rating: 4.9, reviews: 31,
    options: ["Gola", "Punho", "Botões", "Etiqueta"], image: img("polo-gola-personalizada"), back: back("polo-gola-personalizada"), gallery: [img("polo-gola-personalizada"), back("polo-gola-personalizada")],
  },
  {
    slug: "polo-manga-longa", name: "Polo Manga Longa", kind: "custom", category: "operacional",
    price: 0, minQty: 30, colors: ["marinho", "chumbo", "preto"], sizes: ADULT,
    fabric: "Piquet ou dry fit UV", short: "Ideal para ambientes externos e operacionais.",
    description: "Manga longa com punho, opção de faixa refletiva e proteção UV para equipes de campo.",
    features: ["Manga longa com punho", "Opção de faixa refletiva", "Proteção UV", "Reforço nos cotovelos"],
    techniques: ["Bordado", "Silk"], rating: 4.7, reviews: 18,
    options: ["Refletivo", "Punho", "Tecido"], image: img("polo-manga-longa"), back: back("polo-manga-longa"), gallery: [img("polo-manga-longa"), back("polo-manga-longa")],
  },
  {
    slug: "polo-alta-visibilidade", name: "Polo Alta Visibilidade", kind: "custom", category: "alta-visibilidade",
    price: 0, minQty: 30, colors: ["limao", "laranja", "chumbo"], sizes: ADULT,
    fabric: "Dry fit fluorescente", short: "Tecidos e cores específicos para sua operação.",
    description: "Polo bicolor fluorescente com faixas refletivas, conforme normas de segurança da sua operação.",
    features: ["Faixas refletivas", "Bicolor fluorescente", "Conforme NR aplicável", "Tecido respirável"],
    techniques: ["Silk", "Bordado"], rating: 4.8, reviews: 15,
    options: ["Refletivo", "Recortes", "Cores"], image: img("polo-alta-visibilidade"), back: back("polo-alta-visibilidade"), gallery: [img("polo-alta-visibilidade"), back("polo-alta-visibilidade")],
  },
];

export const products: Product[] = base.map((p) => ({ ...p, photos: photos(p.slug) }));

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

/** Opções do antigo configurador (mantidas para pedidos já salvos). */
export const customOptions = {
  fabrics: ["Piquet", "PV", "Dry fit", "Algodão", "Brim", "Gabardine"],
  collars: ["Polo tradicional", "Polo com friso", "Gola careca", "Gola V", "Gola padre"],
  cuffs: ["Sem punho", "Punho liso", "Punho com friso"],
  sleeves: ["Curta", "Longa", "Raglan"],
  extras: ["Faixa refletiva", "Bolso", "Botões personalizados", "Etiqueta própria", "Recorte bicolor"],
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
