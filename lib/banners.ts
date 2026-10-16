// Tipos e conteúdo padrão do banner da home (usado sem banco ou com a tabela vazia).

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  active: boolean;
};

/** Fotos de vitrine trocadas pelo painel: slug → [foto principal, segunda foto] (posições vazias = padrão). */
export type PhotoOverrides = Record<string, (string | null)[]>;

export const defaultBanners: Banner[] = [
  {
    id: "padrao-1",
    title: "Uniformes com a logo da sua empresa",
    subtitle: "Compre online a partir de 5 peças. Fábrica própria e entrega para todo o Brasil.",
    ctaLabel: "Comprar pronta-entrega",
    ctaHref: "/loja?tipo=stock",
    image: "/images/products/polo-pv-basica-modelo-2.webp",
    active: true,
  },
  {
    id: "padrao-2",
    title: "Monte o pedido da sua empresa",
    subtitle: "Vários modelos, cores e quantidades em um só orçamento, a partir de 30 peças.",
    ctaLabel: "Montar meu pedido",
    ctaHref: "/orcamento",
    image: "/images/products/camisa-operacional-brim-modelo-2.webp",
    active: true,
  },
  {
    id: "padrao-3",
    title: "Veja a sua logo na peça antes de comprar",
    subtitle: "Envie a logo, escolha onde aplicar e aprove o layout antes da produção.",
    ctaLabel: "Personalizar agora",
    ctaHref: "/loja",
    image: "/images/products/dolma-chef-modelo-2.webp",
    active: true,
  },
];

/** Link do botão: só caminhos do próprio site ou https. */
export const safeHref = (href: string) => (/^\/(?!\/)/.test(href) || /^https:\/\//.test(href) ? href : "/loja");

/** Imagem aceita: arquivos do site ou do Vercel Blob. */
export const safeImage = (url: string) =>
  /^\/images\//.test(url) || /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//.test(url);
