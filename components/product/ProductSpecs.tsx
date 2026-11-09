import { getCategory, getColor, inStock, type Product } from "@/lib/catalog";
import { fabricOptions } from "@/lib/qualify";
import { CUSTOM_MIN_QTY, STOCK_MIN_QTY } from "@/lib/quote";
import s from "./Specs.module.css";

const list = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}` : (items[0] ?? ""));

/** Código de referência do produto (como o "código" dos marketplaces). */
export const productRef = (p: Product) => `EU-${String(p.slug.split("").reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 100000, 7)).padStart(5, "0")}`;

function care(p: Product) {
  const poly = /poli/i.test(p.composition) && !/algod/i.test(p.composition);
  return `${poly ? "Lavar em água fria (até 30 °C)" : "Lavar em água até 40 °C"}, do avesso. Secar à sombra, sem secadora. Passar em temperatura média, sem passar sobre bordado ou estampa. Não usar alvejante com cloro.`;
}

/** Ficha técnica em uma tabela única, como nos marketplaces (também vai para o Google em dados estruturados). */
export function specRows(p: Product): [string, string][] {
  const stock = inStock(p);
  return [
    ["Fabricante", "Expressão Uniformes (fábrica própria)"],
    ["Código", productRef(p)],
    ["Produto", p.name],
    ["Modelo", p.subtitle],
    ["Categoria", getCategory(p.category)?.name ?? ""],
    ["Tecido", p.fabric],
    ["Composição", p.composition],
    ["Observação do tecido", p.fabricNote],
    ["Tamanhos disponíveis", p.sizeChart.join(", ")],
    [`Cores disponíveis (${p.colors.length})`, p.colors.map((id) => getColor(id)?.name ?? id).join(", ")],
    ...p.highlights.map((h): [string, string] => [h.title, h.text]),
    ["Personalização da logo", list(p.techniques)],
    ["Posições da logo", list(["frente", "costas", "manga"].filter((x) => !p.noPositions?.includes(x as never)))],
    ["Personalização da peça", `${list(fabricOptions.map((o) => o.label.toLowerCase()))} (pedidos de fabricação)`],
    ["Pedido mínimo", stock ? `${STOCK_MIN_QTY} peças na pronta-entrega · ${CUSTOM_MIN_QTY} peças na fabricação` : `${CUSTOM_MIN_QTY} peças`],
    ["Grade", "Pode misturar tamanhos no mesmo pedido"],
    ["Disponibilidade", stock ? "Pronta-entrega e fabricação" : "Fabricação sob encomenda"],
    ["Cuidados", care(p)],
  ];
}

/**
 * "Descrição e ficha técnica" no formato dos marketplaces: código, descrição e uma
 * tabela única. Tudo visível na página (sem abas), o que ajuda o Google a entender a peça.
 */
export function ProductSpecs({ product }: { product: Product }) {
  const stock = inStock(product);
  return (
    <section className={s.specs} id="descricao" aria-labelledby="descricao-titulo">
      <h2 id="descricao-titulo" className={s.h2}>
        Descrição e ficha técnica
      </h2>
      <p className={s.code}>Código {productRef(product)}</p>
      <p className={s.lead}>{product.description}</p>
      <p className={s.text}>
        {product.name} em {product.fabric.toLowerCase()} ({product.composition}), {product.subtitle.toLowerCase()}.{" "}
        {stock
          ? `Pronta-entrega a partir de ${STOCK_MIN_QTY} peças com grade mista de tamanhos: você escolhe a cor, envia a logo, vê como fica na peça e finaliza a compra pelo site. Para ${CUSTOM_MIN_QTY} peças ou mais, a peça também é fabricada nas ${product.colors.length} cores do catálogo.`
          : `Fabricada sob encomenda a partir de ${CUSTOM_MIN_QTY} peças, em ${product.colors.length} ${product.colors.length === 1 ? "cor" : "cores"}. Um consultor confirma tecido, cores, personalização e prazo antes da produção.`}{" "}
        A logo da sua empresa pode ser aplicada em {list(product.techniques).toLowerCase()}.
      </p>

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
