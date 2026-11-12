import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { company, getCategory, getColor, getProduct, inStock, money, products } from "@/lib/catalog";
import { PIX_DISCOUNT } from "@/lib/pricing";
import { CUSTOM_MIN_QTY, STOCK_MIN_QTY } from "@/lib/quote";
import { productFaq } from "@/lib/product-faq";
import { ProductCard } from "@/components/ui/ProductCard";
import { ProductTop } from "@/components/product/ProductTop";
import { productRef, ProductSpecs, specRows } from "@/components/product/ProductSpecs";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { LpStickyBar } from "@/components/lp/LpParts";
import { ProductFaq } from "@/components/lp/ProductFaq";
import l from "@/components/lp/Landing.module.css";

// Página do produto no mesmo formato de marketplace da landing page dos anúncios
// (/lp/[slug]): fundo cinza com cartões, galeria com miniaturas, "quem viu também viu",
// descrição e ficha técnica em tabela, perguntas e respostas e barra fixa ao rolar.
// Aqui o cartão de compra é o completo: cor, tamanhos, logo por posição e carrinho.
type Props = { params: Promise<{ slug: string }> };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://expressaouniformes.vercel.app";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return { title: "Produto não encontrado" };
  return {
    title: `${p.name} personalizado com a sua logo | ${p.fabric}`,
    description: `${p.short} ${inStock(p) ? `Compre online a partir de ${STOCK_MIN_QTY} peças, com a sua logo.` : `Fabricação para empresas a partir de ${CUSTOM_MIN_QTY} peças.`}`,
    alternates: { canonical: `/produto/${p.slug}` },
    openGraph: { title: p.name, description: p.short, images: [{ url: p.photos[0] ?? p.image }], type: "website" },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const category = getCategory(product.category);
  const available = inStock(product);
  const related = [
    ...products.filter((p) => p.slug !== product.slug && p.category === product.category),
    ...products.filter((p) => p.slug !== product.slug && p.category !== product.category && p.kind === product.kind),
  ].slice(0, 8);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        description: product.description,
        sku: productRef(product),
        category: category?.name,
        image: [...product.photos, product.image, product.back, product.side].map((src) => `${SITE}${src}`),
        brand: { "@type": "Brand", name: company.name },
        manufacturer: { "@type": "Organization", name: company.name },
        material: `${product.fabric} (${product.composition})`,
        color: product.colors.map((id) => getColor(id)?.name).filter(Boolean).join(", "),
        size: product.sizeChart.join(", "),
        additionalProperty: specRows(product).map(([name, value]) => ({ "@type": "PropertyValue", name, value })),
        ...(available
          ? {
              offers: {
                "@type": "Offer",
                url: `${SITE}/produto/${product.slug}`,
                priceCurrency: "BRL",
                price: product.price.toFixed(2),
                availability: "https://schema.org/InStock",
                eligibleQuantity: { "@type": "QuantitativeValue", minValue: STOCK_MIN_QTY },
                seller: { "@type": "Organization", name: company.name },
              },
            }
          : {}),
      },
      {
        "@type": "FAQPage",
        mainEntity: productFaq(product).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: SITE },
          { "@type": "ListItem", position: 2, name: category?.name, item: `${SITE}/loja?categoria=${product.category}` },
          { "@type": "ListItem", position: 3, name: product.name, item: `${SITE}/produto/${product.slug}` },
        ],
      },
    ],
  };

  return (
    <div className={l.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <LpStickyBar
        name={product.name}
        price={available ? `a partir de ${money(product.price * (1 - PIX_DISCOUNT))} no Pix` : `Sob cotação · a partir de ${CUSTOM_MIN_QTY} peças`}
        cta={{ label: available ? "Comprar" : "Pedir orçamento", href: "#comprar" }}
        desktopOnly
      />
      <div className="container">
        <nav className={l.crumbs} aria-label="Você está em">
          <Link href="/">Início</Link>
          <ChevronRight size={13} />
          <Link href={`/loja?categoria=${product.category}`}>{category?.name}</Link>
          <ChevronRight size={13} />
          <span aria-current="page">{product.name}</span>
        </nav>

        {/* galeria (simulador da logo, na cor escolhida) + cartão de compra */}
        <div className={`${l.card} ${l.productTop}`} id="comprar">
          <ProductTop product={product} />
        </div>

        {related.length > 0 && (
          <section className={`${l.card} ${l.related}`} aria-labelledby="relacionados">
            <h2 id="relacionados">Quem viu este produto, também viu</h2>
            <div className={l.relatedRow}>
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )}

        <div className={l.card}>
          <ProductSpecs product={product} />
        </div>
        <div className={l.card}>
          <ProductFaq product={product} />
        </div>
      </div>

      <RecentlyViewed current={product.slug} />
    </div>
  );
}
