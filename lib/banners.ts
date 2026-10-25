// Tipos e conteúdo padrão do banner da home (usado sem banco ou com a tabela vazia).

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  /** desktop, horizontal (2400×1000) */
  image: string;
  /** celular, vertical (1080×1350); vazio = usa a de desktop */
  imageMobile: string;
  active: boolean;
};

/** Fotos de vitrine trocadas pelo painel: slug → [foto principal, segunda foto] (posições vazias = padrão). */
export type PhotoOverrides = Record<string, (string | null)[]>;

const hero = (n: number) => ({ image: `/images/banners/hero-${n}.webp`, imageMobile: `/images/banners/hero-${n}-mobile.webp` });

export const defaultBanners: Banner[] = [
  {
    id: "padrao-1",
    title: "Uniformes com a logo da sua empresa",
    subtitle: "Modelos em estoque a partir de 5 peças. Envie sua logo, veja como fica na peça e receba em todo o Brasil.",
    ctaLabel: "Comprar pronta-entrega",
    ctaHref: "/loja?tipo=stock",
    ...hero(1),
    active: true,
  },
  {
    id: "padrao-2",
    title: "Fábrica própria, do tecido à entrega",
    subtitle: "Monte o pedido da sua empresa com vários modelos e receba um orçamento. A partir de 30 peças.",
    ctaLabel: "Montar meu pedido",
    ctaHref: "/orcamento",
    ...hero(2),
    active: true,
  },
  {
    id: "padrao-3",
    title: "Camisetas para eventos, igrejas e grupos",
    subtitle: "A partir de 5 peças, grade do PP ao XGG. Retiros, corridas, confraternizações e ações de marca.",
    ctaLabel: "Ver camisetas",
    ctaHref: "/loja?categoria=camisetas",
    ...hero(3),
    active: true,
  },
];

/** Link do botão: só caminhos do próprio site ou https. */
export const safeHref = (href: string) => (/^\/(?!\/)/.test(href) || /^https:\/\//.test(href) ? href : "/loja");

/** Imagem aceita: arquivos do site ou do Vercel Blob. */
export const safeImage = (url: string) =>
  /^\/images\//.test(url) || /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//.test(url);
