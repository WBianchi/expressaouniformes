import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/lib/catalog";
import { ProductLanding } from "@/components/product/ProductLanding";

// Landing page de anúncio (Google Ads, Meta): cada anúncio aponta para /lp/<produto>.
// É a mesma página do produto (components/product/ProductLanding.tsx); o endereço
// separado só identifica a origem do lead (lp:<produto>). Para o Google, a página
// oficial é /produto/<produto> (canonical), sem conteúdo duplicado.
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return { title: "Produto não encontrado" };
  const description = `${p.name} (${p.subtitle.toLowerCase()}) em ${p.fabric.toLowerCase()} ${p.composition}. ${p.colors.length} cores, tamanhos ${p.sizeChart[0]} ao ${p.sizeChart[p.sizeChart.length - 1]}. Logo em ${p.techniques.join(", ").toLowerCase()}. Direto da fábrica.`;
  return {
    title: `${p.name} personalizado com a sua logo | ${p.fabric}`,
    description,
    alternates: { canonical: `/produto/${p.slug}` },
    openGraph: { title: p.name, description, images: [{ url: p.photos[0] }], type: "website" },
  };
}

export default async function LandingPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  return <ProductLanding product={product} source={`lp:${product.slug}`} />;
}
