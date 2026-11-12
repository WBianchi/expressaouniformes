import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ChevronRight, ClipboardList, Factory, MessageCircle, ShoppingBag, Truck } from "lucide-react";
import { company, getCategory, getColor, getProduct, inStock, money, products, whatsappLink } from "@/lib/catalog";
import { PIX_DISCOUNT } from "@/lib/pricing";
import { CUSTOM_MIN_QTY, STOCK_MIN_QTY } from "@/lib/quote";
import { getClientLogos } from "@/lib/site-media";
import { QualifyFlow } from "@/components/qualify/QualifyFlow";
import { ClientLogos, FactoryStrip, TwoPaths } from "@/components/home/FactorySections";
import { LpGallery } from "@/components/lp/LpGallery";
import { LpColorProvider, LpStickyBar, LpVariants } from "@/components/lp/LpParts";
import { productRef, ProductSpecs, specRows } from "@/components/product/ProductSpecs";
import { ProductFaq } from "@/components/lp/ProductFaq";
import { productFaq } from "@/lib/product-faq";
import { ProductCard } from "@/components/ui/ProductCard";
import s from "@/components/lp/Landing.module.css";

// Landing page de anúncio (Google Ads, Meta): cada anúncio aponta para a página do
// produto anunciado (ex.: /lp/calca-brim-elastico-total). Formato de marketplace:
// galeria, informações, questionário de qualificação e ficha técnica completa,
// que também vai para o Google em dados estruturados (Product + BreadcrumbList).
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://expressaouniformes.vercel.app";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return { title: "Produto não encontrado" };
  const title = `${p.name} personalizado com a sua logo | ${p.fabric}`;
  const description = `${p.name} (${p.subtitle.toLowerCase()}) em ${p.fabric.toLowerCase()} ${p.composition}. ${p.colors.length} cores, tamanhos ${p.sizeChart[0]} ao ${p.sizeChart[p.sizeChart.length - 1]}. Logo em ${p.techniques.join(", ").toLowerCase()}. Direto da fábrica.`;
  return {
    title,
    description,
    alternates: { canonical: `/lp/${p.slug}` },
    openGraph: { title: p.name, description, images: [{ url: p.photos[0] }], type: "website" },
  };
}

export default async function LandingPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const category = getCategory(product.category);
  const available = inStock(product);
  const clientLogos = await getClientLogos();
  const related = [
    ...products.filter((p) => p.slug !== product.slug && p.category === product.category),
    ...products.filter((p) => p.slug !== product.slug && p.category !== product.category && p.kind === product.kind),
  ].slice(0, 8);

  const images = [
    { src: product.photos[0], label: "vestindo, frente" },
    { src: product.photos[1], label: "vestindo, costas" },
    { src: product.image, label: "peça, frente", piece: true },
    { src: product.back, label: "peça, costas", piece: true },
    { src: product.side, label: "peça, lado", piece: true },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        description: product.description,
        sku: productRef(product),
        category: category?.name,
        image: images.map((im) => `${SITE}${im.src}`),
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
                url: `${SITE}/lp/${product.slug}`,
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
          { "@type": "ListItem", position: 3, name: product.name, item: `${SITE}/lp/${product.slug}` },
        ],
      },
    ],
  };

  const cta = available
    ? { label: "Personalizar e comprar", href: `/produto/${product.slug}` }
    : { label: "Solicitar orçamento", href: "#lp-qualifica" };

  return (
    <div className={s.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <LpStickyBar
        name={product.name}
        price={available ? `a partir de ${money(product.price * (1 - PIX_DISCOUNT))} no Pix` : `Sob cotação · a partir de ${CUSTOM_MIN_QTY} peças`}
        cta={cta}
      />
      <div className="container">
        <nav className={s.crumbs} aria-label="Você está em">
          <Link href="/">Início</Link>
          <ChevronRight size={13} />
          <Link href={`/loja?categoria=${product.category}`}>{category?.name}</Link>
          <ChevronRight size={13} />
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className={s.top}>
          {/* cartão principal: galeria + informações e variações */}
          <LpColorProvider colors={product.colors}>
          <div className={`${s.card} ${s.main}`}>
            <LpGallery images={images} name={product.name} />
            <div className={s.info}>
              <span className={s.eyebrow}>
                <Factory size={14} /> {available ? "Pronta-entrega" : "Fabricação"} · {category?.name}
              </span>
              <h1 className={s.title}>{product.name}</h1>
              <p className={s.subtitle}>
                {product.subtitle} · {product.fabric} ({product.composition})
              </p>
              <span className={s.ref}>Código: {productRef(product)}</span>
              <LpVariants colors={product.colors} sizes={product.sizeChart} />
              <ul className={s.facts}>
                <li>
                  <BadgeCheck size={16} /> Sua logo em {product.techniques.join(", ").replace(/, ([^,]*)$/, " ou $1").toLowerCase()}
                </li>
                {product.highlights.map((h) => (
                  <li key={h.title}>
                    <BadgeCheck size={16} /> {h.title}
                  </li>
                ))}
              </ul>
              <p className={s.seller}>
                Fabricado e entregue por <b>{company.name}</b>
              </p>
            </div>
          </div>
          </LpColorProvider>

          {/* cartão de compra: preço, ações e qualificação */}
          <aside className={`${s.card} ${s.buy}`} aria-label="Comprar ou pedir orçamento">
            <div className={s.price}>
              {available ? (
                <>
                  {product.compareAt && <del className={s.muted}>{money(product.compareAt)}</del>}
                  <p>
                    <b>{money(product.price * (1 - PIX_DISCOUNT))}</b> <small>no Pix</small>
                  </p>
                  <span className={s.muted}>ou {money(product.price)} no cartão em até 6x sem juros (parcela mínima de R$ 50)</span>
                  <span className={s.muted}>Preço por peça lisa · pedido mínimo de {STOCK_MIN_QTY} peças</span>
                </>
              ) : (
                <>
                  <span className={s.status}>
                    <Factory size={14} /> Sob cotação
                  </span>
                  <p>
                    <b className={s.priceSm}>Fabricação a partir de {CUSTOM_MIN_QTY} peças</b>
                  </p>
                  <span className={s.muted}>Preço de fábrica conforme quantidade, tecido e personalização.</span>
                </>
              )}
            </div>
            {available && (
              <p className={s.delivery}>
                <Truck size={16} /> Entrega para todo o Brasil · frete calculado no carrinho
              </p>
            )}
            <div className={s.ctas}>
              {available ? (
                <Link href={cta.href} className={`btn btn-lg ${s.buyBtn}`}>
                  <ShoppingBag size={18} /> {cta.label}
                </Link>
              ) : (
                <a href={cta.href} className={`btn btn-lg ${s.buyBtn}`}>
                  <ClipboardList size={18} /> {cta.label}
                </a>
              )}
              <a
                href={whatsappLink(`Olá! Tenho interesse em ${product.name} (${productRef(product)}). Pode me ajudar?`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-lg"
              >
                <MessageCircle size={18} /> Falar com um consultor
              </a>
            </div>
            <div className={s.box} id="lp-qualifica">
              <h2>Monte seu pedido em 1 minuto</h2>
              <p>Responda rapidinho e mostramos o caminho mais rápido para o seu pedido.</p>
              <QualifyFlow product={product.slug} source={`lp:${product.slug}`} />
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className={`${s.card} ${s.related}`} aria-labelledby="relacionados">
            <h2 id="relacionados">Quem viu este produto, também viu</h2>
            <div className={s.relatedRow}>
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )}

        <div className={s.card}>
          <ProductSpecs product={product} />
        </div>
        <div className={s.card}>
          <ProductFaq product={product} />
        </div>
      </div>

      <TwoPaths product={product.slug} compact />
      <FactoryStrip />
      <ClientLogos logos={clientLogos} />
    </div>
  );
}
