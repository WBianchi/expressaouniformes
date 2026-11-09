import type { Product } from "@/lib/catalog";
import { productFaq } from "@/lib/product-faq";
import s from "./Landing.module.css";

/** Perguntas e respostas do produto, abertas por clique (texto sempre no HTML, bom para o Google). */
export function ProductFaq({ product }: { product: Product }) {
  return (
    <section className={s.faq} aria-labelledby="perguntas">
      <h2 id="perguntas">Perguntas e respostas</h2>
      <div className={s.faqList}>
        {productFaq(product).map((f, i) => (
          <details key={f.q} className={s.faqItem} open={i === 0}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
