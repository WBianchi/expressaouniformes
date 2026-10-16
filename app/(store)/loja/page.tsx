import type { Metadata } from "next";
import Catalog from "@/components/catalog/Catalog";
import { parseFilters } from "@/components/catalog/filters";
import { getCategory } from "@/lib/catalog";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const f = parseFilters(await searchParams);
  const cat = f.categoria ? getCategory(f.categoria) : undefined;
  return {
    title: cat ? `${cat.name} para personalizar` :"Loja de uniformes",
    description:
      cat?.description ??
      "Uniformes em estoque prontos para personalizar com a sua logo e modelos por orçamento para empresas.",
    alternates: { canonical: cat ? `/loja?categoria=${cat.slug}` : "/loja" },
  };
}

export default async function LojaPage({ searchParams }: Props) {
  const initial = parseFilters(await searchParams);
  return <Catalog initial={initial} />;
}
