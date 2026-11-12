import Link from "next/link";
import { BadgeCheck, ChevronRight, ClipboardList, Factory, MessageCircle, ShoppingBag, Truck } from "lucide-react";
import { company, getCategory, getColor, inStock, money, products, whatsappLink, type Product } from "@/lib/catalog";
import { PIX_DISCOUNT } from "@/lib/pricing";
import { CUSTOM_MIN_QTY, STOCK_MIN_QTY } from "@/lib/quote";
import { productFaq } from "@/lib/product-faq";
import { getClientLogos, getPhotoOverrides } from "@/lib/site-media";
import { QualifyFlow } from "@/components/qualify/QualifyFlow";
import { ClientLogos, FactoryStrip, TwoPaths } from "@/components/home/FactorySections";
import { LpGallery } from "@/components/lp/LpGallery";
import { LpColorProvider, LpStickyBar, LpVariants } from "@/components/lp/LpParts";
import { ProductFaq } from "@/components/lp/ProductFaq";
import { ProductCard } from "@/components/ui/ProductCard";
import { productRef, ProductSpecs, specRows } from "./ProductSpecs";
import { ProductTop } from "./ProductTop";
import { RecentlyViewed } from "./RecentlyViewed";
import s from "@/components/lp/Landing.module.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://expressaouniformes.vercel.app";

/**
 * Página do produto no formato de marketplace (Magalu), a mesma para todos os produtos:
 * vale para /produto/[slug] (vitrine do site) e /lp/[slug] (anúncios).
 * Topo: galeria com miniaturas, informações e cartão de preço com o questionário.
 * Logo abaixo, "Personalize e compre": simulador da logo, tamanhos e carrinho
 * (ou o orçamento, nas peças de fabricação). Depois relacionados, ficha técnica e perguntas.
 */
export async function ProductLanding({ product, source }: { product: Product; source: string }) {
  const category = getCategory(product.category);
  const available = inStock(product);
  const [clientLogos, overrides] = await Promise.all([getClientLogos(), getPhotoOverrides()]);
  // fotos com a pessoa vestindo: as trocadas no painel valem aqui também
  const photos = product.photos.map((src, i) => overrides[product.slug]?.[i] ?? src);
  const related = [
    ...products.filter((p) => p.slug !== product.slug && p.category === product.category),
    ...products.filter((p) => p.slug !== product.slug && p.category !== product.category && p.kind === product.kind),
  ].slice(0, 8);

  const images = [
    { src: photos[0], label: "vestindo, frente" },
    { src: photos[1], label: "vestindo, costas" },
    { src: product.image, label: "peça, frente", piece: true },
    { src: product.back, label: "peça, costas", piece: true },
    { src: product.side, label: "peça, lado", piece: true },
  ].filter((im) => !!im.src);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        description: product.description,
        sku: productRef(product),
        category: category?.name,
        image: images.map((im) => (im.src.startsWith("http") ? im.src : `${SITE}${im.src}`)),
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

  // pronta-entrega: vai para o simulador e a compra; fabricação: questionário de qualificação
  const cta = available ? { label: "Personalizar e comprar", href: "#personalizar" } : { label: "Solicitar orçamento", href: "#lp-qualifica" };

  return (
    <div className={s.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <LpStickyBar
        name={product.name}
        price={available ? `a partir de ${money(product.price * (1 - PIX_DISCOUNT))} no Pix` : `Sob cotação · a partir de ${CUSTOM_MIN_QTY} peças`}
        cta={cta}
        desktopOnly
      />
      <LpColorProvider colors={product.colors}>
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
                <a href={cta.href} className={`btn btn-lg ${s.buyBtn}`}>
                  {available ? <ShoppingBag size={18} /> : <ClipboardList size={18} />} {cta.label}
                </a>
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
                <QualifyFlow product={product.slug} source={source} />
              </div>
            </aside>
          </div>

          {/* simulador da logo + compra (ou orçamento), na mesma cor escolhida no topo */}
          <section className={`${s.card} ${s.personalize}`} id="personalizar" aria-labelledby="personalizar-titulo">
            <h2 id="personalizar-titulo" className={s.sectionTitle}>
              {available ? "Personalize e compre" : "Monte seu orçamento"}
            </h2>
            <p className={s.sectionLead}>
              {available
                ? `Escolha a cor, envie a sua logo e veja como fica na peça. Pedido a partir de ${STOCK_MIN_QTY} peças, com grade mista de tamanhos.`
                : `Escolha a cor, envie a sua logo e veja como fica na peça. Fabricação a partir de ${CUSTOM_MIN_QTY} peças; um consultor confirma os detalhes.`}
            </p>
            <ProductTop product={product} embedded />
          </section>
        </div>
      </LpColorProvider>

      <div className="container">
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

      <RecentlyViewed current={product.slug} />
      <TwoPaths product={product.slug} compact />
      <FactoryStrip />
      <ClientLogos logos={clientLogos} />
    </div>
  );
}
