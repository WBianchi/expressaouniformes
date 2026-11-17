import type { Product } from "@/lib/catalog";
import { productRef, specRows } from "@/lib/specs";
import s from "./Specs.module.css";

export { productRef, specRows };

/**
 * "Descrição e ficha técnica" no formato dos marketplaces: código, descrição e uma
 * tabela única. Tudo visível na página (sem abas), o que ajuda o Google a entender a peça.
 */
export function ProductSpecs({ product }: { product: Product }) {
  return (
    <section className={s.specs} id="descricao" aria-labelledby="descricao-titulo">
      <h2 id="descricao-titulo" className={s.h2}>
        Descrição e ficha técnica
      </h2>
      <p className={s.code}>Código {productRef(product)}</p>
      {/* só a descrição do anúncio (editável no painel); o resto está na ficha técnica abaixo */}
      <p className={s.lead}>{product.description}</p>

      <h3 className={s.h3}>Ficha técnica</h3>
      <table className={s.table}>
        <caption className="sr-only">Ficha técnica de {product.name}</caption>
        <tbody>
          {specRows(product).map(([k, v]) => (
            <tr key={k}>
              <th scope="row">{k}</th>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={s.note}>As cores na tela podem variar levemente do tecido real. Peça uma amostra ao consultor.</p>
    </section>
  );
}
