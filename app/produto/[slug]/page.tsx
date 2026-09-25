import { products } from "@/lib/catalog";
import ProductDetail from "@/components/store/ProductDetail";
import { notFound } from "next/navigation";
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title:
      products.find((p) => p.id === slug)?.name || "Produto não encontrado",
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = products.find((p) => p.id === slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
