import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, products, seoDescription } from "@/lib/catalog";
import { syncCatalog } from "@/lib/listings-server";
import { ProductLanding } from "@/components/product/ProductLanding";

// Página do produto: o mesmo formato de marketplace da landing page dos anúncios
// (components/product/ProductLanding.tsx), com a compra completa logo abaixo do topo.
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
    openGraph: { title: p.name, description, images: [{ url: p.photos[0] ?? p.image }], type: "website" },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  await syncCatalog();
  const product = getProduct(slug);
  if (!product) notFound();
  return <ProductLanding product={product} source={`produto:${product.slug}`} />;
}
