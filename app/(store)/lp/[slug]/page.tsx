import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, Factory, Truck } from "lucide-react";
import { getCategory, getProduct, inStock, money, products } from "@/lib/catalog";
import { CUSTOM_MIN_QTY, STOCK_MIN_QTY } from "@/lib/quote";
import { getClientLogos } from "@/lib/site-media";
import { QualifyFlow } from "@/components/qualify/QualifyFlow";
import { ClientLogos, FactoryStrip, TwoPaths } from "@/components/home/FactorySections";
import { Faq } from "@/components/home/Faq";
import { SafeImage, Swatches } from "@/components/ui/primitives";
import s from "@/components/lp/Landing.module.css";

// Landing page de anúncio: cada anúncio aponta para a página do produto anunciado
// (ex.: /lp/calca-brim-profissional). O questionário qualifica e direciona.
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return { title: "Produto não encontrado" };
  return {
    title: `${p.name} personalizada direto da fábrica`,
    description: `${p.short} Sua logo em silk, bordado, DTF ou sublimação. A partir de ${STOCK_MIN_QTY} peças pelo site ou ${CUSTOM_MIN_QTY}+ com fabricação.`,
    alternates: { canonical: `/lp/${p.slug}` },
    openGraph: { title: p.name, description: p.short, images: [{ url: p.image }], type: "website" },
  };
}

export default async function LandingPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const category = getCategory(product.category);
  const available = inStock(product);
  const clientLogos = await getClientLogos();

  return (
    <>
      <section className={s.hero}>
        <div className={`container ${s.heroGrid}`}>
          <div className={s.copy}>
            <span className={s.eyebrow}>
              <Factory size={15} /> Direto da fábrica · {category?.name}
            </span>
            <h1>{product.name} com a logo da sua empresa</h1>
            <p className={s.lead}>{product.description}</p>
            <div className={s.pics}>
              {[product.image, product.back, product.side].map((src, i) => (
                <span key={src} className={s.pic}>
                  <SafeImage src={src} alt={i === 0 ? product.name : ""} priority={i === 0} />
                </span>
              ))}
            </div>
            <ul className={s.facts}>
              {available ? (
                <li>
                  <Truck size={16} /> Pronta-entrega a partir de {STOCK_MIN_QTY} peças · a partir de <b>{money(product.price)}</b>
                </li>
              ) : (
                <li>
                  <Factory size={16} /> Produzido na fábrica a partir de {CUSTOM_MIN_QTY} peças
                </li>
              )}
              <li>
                <BadgeCheck size={16} /> Logo em {product.techniques.join(", ").replace(/, ([^,]*)$/, " ou $1")}
              </li>
              <li>
                <BadgeCheck size={16} /> {product.fabric}
              </li>
            </ul>
            <div className={s.colors}>
              <span>Cores:</span> <Swatches ids={product.colors} size="sm" max={10} />
            </div>
          </div>

          <aside className={s.box} aria-labelledby="lp-qualifica">
            <h2 id="lp-qualifica">Monte seu pedido em 1 minuto</h2>
            <p>Responda 3 perguntas e mostramos o caminho mais rápido para o seu pedido.</p>
            <QualifyFlow product={product.slug} source={`lp:${product.slug}`} />
          </aside>
        </div>
      </section>

      <TwoPaths product={product.slug} compact />
      <FactoryStrip />
      <ClientLogos logos={clientLogos} />
      <Faq />
    </>
  );
}
