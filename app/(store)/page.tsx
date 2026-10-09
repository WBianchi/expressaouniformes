import type { Metadata } from "next";
import { company } from "@/lib/catalog";
import { HeroSlider } from "@/components/home/HeroSlider";
import { BenefitsBar, BenefitsMarquee } from "@/components/home/BenefitsBar";
import { HowToBuy } from "@/components/home/HowToBuy";
import { CategoryCarousel } from "@/components/home/CategoryCarousel";
import { StockShowcase } from "@/components/home/StockShowcase";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CustomBlock } from "@/components/home/CustomBlock";
import { PromoBanners } from "@/components/home/PromoBanners";
import { BestSellers } from "@/components/home/BestSellers";
import { Segments } from "@/components/home/Segments";
import { SocialProof } from "@/components/home/SocialProof";
import { About } from "@/components/home/About";
import { Faq } from "@/components/home/Faq";
import { faqs } from "@/components/home/faqData";
import { FinalCta } from "@/components/home/FinalCta";

export const metadata: Metadata = {
  title: { absolute: "Expressão Uniformes | Uniformes personalizados para empresas, eventos e igrejas" },
  description:
    "Uniformes em estoque prontos para personalizar com a sua logo a partir de 5 peças e produção sob medida para empresas a partir de 30 peças. Fábrica própria e entrega para todo o Brasil.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: company.name,
    title: "Expressão Uniformes | Sua marca no uniforme em poucos dias",
    description: "Pronta-entrega a partir de 5 peças, aprovação da arte online e produção sob medida para empresas.",
    images: [{ url: "/images/banners/hero-1.webp", alt: "Uniformes personalizados Expressão" }],
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

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <HeroSlider />
      <BenefitsBar />
      <HowToBuy />
      <CategoryCarousel />
      <StockShowcase />
      <BenefitsMarquee />
      <HowItWorks />
      <CustomBlock />
      <Segments />
      <PromoBanners />
      <BestSellers />
      <SocialProof />
      <About />
      <Faq />
      <FinalCta />
    </>
  );
}
