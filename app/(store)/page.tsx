import type { Metadata } from "next";
import { company } from "@/lib/catalog";
import { CategoryGrid, ProductSection, TwoWays } from "@/components/home/HomeSections";
import { HeroSlider } from "@/components/home/HeroSlider";
import { getBanners } from "@/lib/site-media";
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
    images: [{ url: "/images/products/polo-pv-basica.webp", alt: "Polo personalizada Expressão Uniformes" }],
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
  const banners = await getBanners();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <HeroSlider banners={banners} />
      <TwoWays />
      <CategoryGrid />
      <ProductSection mode="stock" />
      <ProductSection mode="quote" />
      <Faq />
    </>
  );
}
