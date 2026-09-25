"use client";
import { fabrics, defaultGarment } from "@/lib/garment";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ShoppingBag,
  Trash2,
  Pencil,
  ArrowRight,
  LockKeyhole,
} from "lucide-react";
import { products, money } from "@/lib/catalog";
import { useStore } from "./StoreProvider";
import { StoreShell } from "./Chrome";
const Shirt = dynamic(() => import("@/components/studio/ShirtPreview"), {
  ssr: false,
});
export default function Cart() {
  const { cart, removeItem, openStudio, ready } = useStore();
  const subtotal = cart.reduce(
    (sum, i) =>
      sum +
      (products.find((p) => p.id === i.productId)?.price || 0) * i.quantity,
    0,
  );
  return (
    <StoreShell>
      <div className="page-heading">
        <span className="eyebrow">QUASE PRONTO PARA VESTIR SUA IDEIA</span>
        <h1>Seu carrinho.</h1>
        <p>
          {cart.length}{" "}
          {cart.length === 1
            ? "projeto personalizado"
            : "projetos personalizados"}
        </p>
      </div>
      {!ready ? (
        <div className="empty-state">Carregando seu carrinho…</div>
      ) : !cart.length ? (
        <div className="empty-state">
          <ShoppingBag size={40} />
          <h2>Sua próxima criação começa aqui.</h2>
          <p>Escolha uma peça e adicione sua marca no estúdio.</p>
          <Link href="/loja" className="button primary">
            Explorar uniformes <ArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <section className="cart-layout">
          <div>
            {cart.map((item) => {
              const p = products.find((p) => p.id === item.productId);
              if (!p) return null;
              return (
                <article className="cart-row" key={item.id}>
                  <div className="cart-preview">
                    <Shirt
                      zoom={220}
                      color={item.design.color}
                      garment={item.design.garment}
                      front={item.design.frontImage}
                      back={item.design.backImage}
                    />
                  </div>
                  <div className="cart-info">
                    <span className="eyebrow">{p.category}</span>
                    <h3>{p.name}</h3>
                    <p>
                      {item.design.technique} · {item.quantity} unidades
                      {" · "}
                      {
                        fabrics[(item.design.garment || defaultGarment).fabric]
                          .name
                      }
                      {item.design.garment?.collarEnabled &&
                        " · Gola personalizada"}
                      {item.design.garment?.sleevesEnabled &&
                        " · Mangas personalizadas"}
                    </p>
                    <div className="size-summary">
                      {Object.entries(item.design.sizes)
                        .filter(([, q]) => q > 0)
                        .map(([s, q]) => (
                          <span key={s}>
                            {s}: {q}
                          </span>
                        ))}
                    </div>
                    <button
                      className="text-button"
                      onClick={() => openStudio(p, item.design, item.id)}
                    >
                      <Pencil size={13} /> Editar personalização
                    </button>
                  </div>
                  <div className="cart-price">
                    <strong>{money(p.price * item.quantity)}</strong>
                    <small>{money(p.price)} / un.</small>
                    <button
                      aria-label={"Remover " + p.name}
                      className="icon-button"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              );
            })}
            <Link href="/loja" className="text-button">
              Continuar explorando
            </Link>
          </div>
          <aside className="order-summary">
            <h3>Resumo da sua criação</h3>
            <div>
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div>
              <span>Entrega</span>
              <span>A calcular</span>
            </div>
            <hr />
            <div className="summary-total">
              <span>Total estimado</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <Link href="/checkout" className="button primary">
              Ir para checkout <ArrowRight size={16} />
            </Link>
            <p>
              <LockKeyhole size={13} /> Ambiente demonstrativo. Não há cobrança.
            </p>
            <small>
              Seus projetos estão salvos apenas neste navegador. Exporte a arte
              no estúdio para manter uma cópia.
            </small>
          </aside>
        </section>
      )}
    </StoreShell>
  );
}
