import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ChevronRight, Wand2 } from "lucide-react";
import { getCategory, getProduct, inStock, products } from "@/lib/catalog";
import { STOCK_MIN_QTY } from "@/lib/quote";
import { ProductTop } from "@/components/product/ProductTop";
import s from "@/components/lp/Landing.module.css";

// Simulador da logo + compra, separado da página do produto (landing page).
// Só existe para a pronta-entrega: chega-se aqui pelo botão "Simular e comprar".
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.filter((p) => inStock(p)).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return { title: "Produto não encontrado" };
  return {
    title: `Simulador: ${p.name} com a sua logo`,
    description: `Envie a sua logo, veja como fica na peça, escolha cor e tamanhos e compre ${p.name} a partir de ${STOCK_MIN_QTY} peças.`,
    alternates: { canonical: `/produto/${p.slug}/simulador` },
    // a página que deve aparecer no Google é a do produto
    robots: { index: false, follow: true },
  };
}

export default async function SimulatorPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  // peça de fabricação não tem simulador: volta para o orçamento na página do produto
  if (!inStock(product)) redirect(`/produto/${product.slug}#lp-qualifica`);
  const category = getCategory(product.category);

  return (
    <div className={s.page}>
      <div className="container">
        <nav className={s.crumbs} aria-label="Você está em">
          <Link href="/">Início</Link>
          <ChevronRight size={13} />
          <Link href={`/loja?categoria=${product.category}`}>{category?.name}</Link>
          <ChevronRight size={13} />
          <Link href={`/produto/${product.slug}`}>{product.name}</Link>
          <ChevronRight size={13} />
          <span aria-current="page">Simulador</span>
        </nav>

        <section className={s.card} aria-label={`Simulador: ${product.name}`}>
          <div className={s.simBar}>
            <Link href={`/produto/${product.slug}`}>
              <ArrowLeft size={16} /> Voltar para o produto
            </Link>
            <span className={s.simTag}>
              <Wand2 size={15} /> Simulador da sua logo · pronta-entrega a partir de {STOCK_MIN_QTY} peças
            </span>
          </div>
          <ProductTop product={product} />
        </section>
      </div>
    </div>
  );
}
