import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { company, getCategory, getProduct, products } from "@/lib/catalog";
import { ProductCard } from "@/components/ui/ProductCard";
import { SectionHeader } from "@/components/ui/primitives";
import { Gallery } from "@/components/product/Gallery";
import { StockBuyBox } from "@/components/product/StockBuyBox";
import { CustomBuyBox } from "@/components/product/CustomBuyBox";
import { ProductTabs } from "@/components/product/ProductTabs";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { ProductStory } from "@/components/product/ProductStory";
import { RevealRoot } from "@/components/product/motion";
import s from "@/components/product/Product.module.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return { title: "Produto não encontrado" };
  const title = p.kind === "stock" ? `${p.name} com sua logo` : `${p.name} sob medida`;
  return {
    title,
    description: `${p.short} ${p.kind === "stock" ? `A partir de ${p.minQty} peças, pronta para personalizar.` : `Produção sob medida a partir de ${p.minQty} peças.`}`,
    alternates: { canonical: `/produto/${p.slug}` },
    openGraph: { title: p.name, description: p.short, images: [{ url: p.image }], type: "website" },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const category = getCategory(product.category);
  const sameCat = products.filter((p) => p.slug !== product.slug && p.category === product.category);
  const related = [...sameCat.filter((p) => p.kind === product.kind), ...sameCat.filter((p) => p.kind !== product.kind)].slice(0, 5);
  const fill = related.length < 5 ? products.filter((p) => p.slug !== product.slug && p.kind === product.kind && !related.includes(p)).slice(0, 5 - related.length) : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [product.image, ...product.gallery.filter((g) => g !== product.image)],
    sku: product.slug,
    category: category?.name,
    material: product.fabric,
    brand: { "@type": "Brand", name: company.name },
    aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviews },
    ...(product.kind === "stock"
      ? {
          offers: {
            "@type": "Offer",
            price: product.price.toFixed(2),
            priceCurrency: "BRL",
            availability: (product.stock ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            eligibleQuantity: { "@type": "QuantitativeValue", minValue: product.minQty },
            seller: { "@type": "Organization", name: company.name },
          },
        }
      : {}),
  };

  return (
    <RevealRoot className={s.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container">
        <nav aria-label="Trilha de navegação" className={s.crumbs}>
          <Link href="/">Início</Link>
          <ChevronRight size={13} aria-hidden />
          <Link href="/loja">Produtos</Link>
          {category && (
            <>
              <ChevronRight size={13} aria-hidden />
              <Link href={`/loja?categoria=${category.slug}`}>{category.name}</Link>
            </>
          )}
          <ChevronRight size={13} aria-hidden />
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className={s.top}>
          <Gallery product={product} />
          {product.kind === "stock" ? <StockBuyBox product={product} /> : <CustomBuyBox product={product} />}
        </div>

        <ProductTabs product={product} />
      </div>

      <ProductStory product={product} />

      {related.length + fill.length > 0 && (
        <section className={`container ${s.related}`} aria-labelledby="related-title" data-reveal="">
          <SectionHeader
            eyebrow={category?.name}
            title={<span id="related-title">Produtos relacionados</span>}
            action={
              <Link href={`/loja?categoria=${product.category}`} className="btn btn-outline btn-sm">
                Ver todos <ChevronRight size={15} />
              </Link>
            }
          />
          <div className={s.relatedGrid}>
            {[...related, ...fill].map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </section>
      )}

      <RecentlyViewed current={product.slug} />
    </RevealRoot>
  );
}
