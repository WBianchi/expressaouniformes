"use client";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, ArrowRight, Factory, MessageCircle, Palette, ShoppingBag, Sparkles, Trash2 } from "lucide-react";
import { getProduct, stockProducts, whatsappLink } from "@/lib/catalog";
import { useStore } from "@/components/store/StoreProvider";
import { ProductCard } from "@/components/ui/ProductCard";
import { CartLineItem } from "./CartLineItem";
import { CartSummary } from "./CartSummary";
import s from "./Cart.module.css";

export function CartPage() {
  const { cart, ready, summary, clearCart } = useStore();

  const related = useMemo(() => {
    const inCart = new Set(cart.map((l) => l.slug));
    const cats = new Set(cart.map((l) => getProduct(l.slug)?.category));
    const pool = stockProducts.filter((p) => !inCart.has(p.slug));
    const same = pool.filter((p) => cats.has(p.category));
    const rest = pool.filter((p) => !cats.has(p.category)).sort((a, b) => b.reviews - a.reviews);
    return [...same, ...rest].slice(0, 6);
  }, [cart]);

  if (!ready) {
    return (
      <div className={`container ${s.page}`} aria-busy="true">
        <div className={`skeleton ${s.skelTitle}`} />
        <div className={s.layout}>
          <div className={s.lines}>
            {[0, 1].map((i) => <div key={i} className={`skeleton ${s.skelLine}`} />)}
          </div>
          <div className={`skeleton ${s.skelSummary}`} />
        </div>
      </div>
    );
  }

  if (!cart.length) {
    return (
      <div className={`container ${s.page}`}>
        <section className={s.empty}>
          <div className={`${s.emptyArt} pattern-dots`} aria-hidden>
            <span className={s.emptyIcon}><ShoppingBag size={40} strokeWidth={1.5} /></span>
            <span className={s.emptyOrbit} />
          </div>
          <h1>Seu carrinho está vazio</h1>
          <p>Escolha um modelo pronta-entrega, monte a grade a partir de 5 peças e envie sua logo. A gente cuida do resto.</p>
          <div className={s.emptyActions}>
            <Link href="/loja?tipo=stock" className="btn btn-accent btn-lg">
              Ver pronta-entrega <ArrowRight size={18} />
            </Link>
            <Link href="/sob-medida" className="btn btn-outline btn-lg">Produção sob medida</Link>
          </div>
          <ul className={s.emptySteps}>
            <li><Palette size={18} strokeWidth={1.75} /> Escolha cor e grade</li>
            <li><Sparkles size={18} strokeWidth={1.75} /> Envie sua logo</li>
            <li><Factory size={18} strokeWidth={1.75} /> Aprove o layout e produzimos</li>
          </ul>
        </section>
        {related.length > 0 && (
          <section className={s.related} aria-labelledby="rel-title">
            <h2 id="rel-title">Mais vendidos para começar</h2>
            <div className={s.relatedGrid}>
              {related.map((p) => <ProductCard key={p.slug} product={p} />)}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className={`container ${s.page}`}>
      <nav className={s.progress} aria-label="Etapas da compra">
        <ol>
          <li data-state="current" aria-current="step"><span>1</span> Carrinho</li>
          <li><span>2</span> Dados e entrega</li>
          <li><span>3</span> Pagamento</li>
        </ol>
      </nav>

      <header className={s.head}>
        <div>
          <h1>Seu carrinho</h1>
          <p>{cart.length} {cart.length === 1 ? "modelo" : "modelos"} · {summary.items} peças</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => confirm("Esvaziar o carrinho?") && clearCart()}>
          <Trash2 size={15} /> Esvaziar
        </button>
      </header>

      <div className={s.layout}>
        <div className={s.lines}>
          <div className={s.artNotice} role="note">
            <Palette size={20} strokeWidth={1.75} />
            <p>
              <b>Sua arte é aprovada antes da produção.</b> Depois do pagamento, enviamos o layout com a logo aplicada em
              <i> Minha conta › Pedidos</i>. Só produzimos após o seu ok.
            </p>
          </div>

          {cart.map((line, i) => <CartLineItem key={line.id} line={line} index={i} />)}

          <div className={s.linesFoot}>
            <Link href="/loja?tipo=stock" className="btn btn-ghost">
              <ArrowLeft size={16} /> Continuar comprando
            </Link>
            <a className="btn btn-ghost" href={whatsappLink("Olá! Tenho dúvidas sobre o meu carrinho na loja.")} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={16} /> Dúvidas? Fale conosco
            </a>
          </div>
        </div>

        <CartSummary />
      </div>

      {related.length > 0 && (
        <section className={s.related} aria-labelledby="rel-title">
          <h2 id="rel-title">Complete o uniforme da equipe</h2>
          <div className={s.relatedGrid}>
            {related.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
