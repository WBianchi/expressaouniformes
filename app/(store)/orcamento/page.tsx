import type { Metadata } from "next";
import { QuoteBuilder } from "@/components/quote/QuoteBuilder";
import { CUSTOM_MIN_QTY } from "@/lib/quote";
import s from "@/components/quote/Quote.module.css";

export const metadata: Metadata = {
  title: "Monte seu pedido — orçamento de uniformes para empresas",
  description: `Monte o pedido de uniformes da sua empresa: escolha os modelos, cores e quantidades, veja a sua logo nas peças e envie para um consultor. A partir de ${CUSTOM_MIN_QTY} peças.`,
  alternates: { canonical: "/orcamento" },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { modelo } = await searchParams;
  return (
    <div className={`container ${s.page}`}>
      <header className={s.pageHead}>
        <h1>Monte seu pedido</h1>
        <p>
          Faça o orçamento dos uniformes da sua empresa: escolha os modelos, cores e quantidades, veja a sua logo nas peças e envie para um consultor. A partir de{" "}
          {CUSTOM_MIN_QTY} peças no total.
        </p>
        <ol className={s.steps}>
          <li>
            <b>1</b> Escolha os itens
          </li>
          <li>
            <b>2</b> Envie a logo
          </li>
          <li>
            <b>3</b> Receba o orçamento pelo WhatsApp
          </li>
        </ol>
      </header>
      <QuoteBuilder initial={typeof modelo === "string" ? modelo : undefined} />
    </div>
  );
}
