import type { Metadata } from "next";
import { company } from "@/lib/catalog";
import { CategoryGrid, ProductSection } from "@/components/home/HomeSections";
import { ClientLogos, FactoryStrip, TwoPaths } from "@/components/home/FactorySections";
import { HeroSlider } from "@/components/home/HeroSlider";
import { getBanners, getClientLogos } from "@/lib/site-media";
import { Faq } from "@/components/home/Faq";
import { faqs } from "@/components/home/faqData";

export const metadata: Metadata = {
  title: { absolute: "Expressão Uniformes | Uniformes personalizados para empresas, eventos e igrejas" },
  description:
    "Uniformes prontos para personalizar com a sua logo a partir de 5 peças e orçamento para empresas a partir de 30 peças. Fábrica própria e entrega para todo o Brasil.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: company.name,
    title: "Expressão Uniformes | Uniformes com a logo da sua empresa",
    description: "Pronta-entrega a partir de 5 peças com a sua logo e orçamento para empresas a partir de 30 peças.",
    images: [{ url: "/images/products/camiseta-malha-pv-modelo-1.webp", alt: "Camiseta personalizada Expressão Uniformes" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: company.name,
      email: company.email,
      telephone: company.phone,
      sameAs: [company.instagram],
      logo: "/images/logo-on-light.png",
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default async function HomePage() {
  const [banners, clientLogos] = await Promise.all([getBanners(), getClientLogos()]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <HeroSlider banners={banners} />
      <TwoPaths />
      <CategoryGrid />
      <ProductSection mode="stock" />
      <FactoryStrip />
      <ProductSection mode="quote" />
      <ClientLogos logos={clientLogos} />
      <Faq />
    </>
  );
}
