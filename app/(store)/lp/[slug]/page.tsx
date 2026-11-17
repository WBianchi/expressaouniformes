import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, products, seoDescription } from "@/lib/catalog";
import { syncCatalog } from "@/lib/listings-server";
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
  await syncCatalog();
  const p = getProduct(slug);
  if (!p) return { title: "Produto não encontrado" };
  const description = seoDescription(p);
  return {
    title: `${p.name} personalizado com a sua logo${p.fabric ? ` | ${p.fabric}` : ""}`,
    description,
    alternates: { canonical: `/produto/${p.slug}` },
    openGraph: { title: p.name, description, images: [{ url: p.photos[0] }], type: "website" },
  };
}

export default async function LandingPage({ params }: Props) {
  const { slug } = await params;
  await syncCatalog();
  const product = getProduct(slug);
  if (!product) notFound();
  return <ProductLanding product={product} source={`lp:${product.slug}`} />;
}
