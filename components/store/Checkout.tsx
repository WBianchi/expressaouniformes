"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, LockKeyhole } from "lucide-react";
import { StoreShell } from "./Chrome";
import { useStore } from "./StoreProvider";
import { money, products } from "@/lib/catalog";
export default function Checkout() {
  const { cart, ready } = useStore();
  const [review, setReview] = useState(false);
  const total = cart.reduce(
    (s, i) =>
      s + (products.find((p) => p.id === i.productId)?.price || 0) * i.quantity,
    0,
  );
  return (
    <StoreShell>
      <div className="page-heading">
        <span className="eyebrow">SEU PROJETO, UM PASSO MAIS PERTO</span>
        <h1>Finalizar sua criação.</h1>
        <p>Prévia do checkout · nenhum pedido será enviado ou cobrado.</p>
      </div>
      {!ready ? (
        <div className="empty-state">Carregando…</div>
      ) : !cart.length ? (
        <div className="empty-state">
          <h2>Seu carrinho está vazio.</h2>
          <Link className="button primary" href="/loja">
            Explorar coleção
          </Link>
        </div>
      ) : (
        <form
          className="cart-layout"
          onSubmit={(e) => {
            e.preventDefault();
            setReview(true);
          }}
        >
          <div className="checkout-fields">
            <h2>01. Seus dados</h2>
            <div className="form-grid">
              <label>
                Nome completo
                <input required autoComplete="name" name="name" />
              </label>
              <label>
                E-mail
                <input
                  required
                  type="email"
                  autoComplete="email"
                  name="email"
                />
              </label>
              <label>
                Empresa
                <input required name="company" autoComplete="organization" />
              </label>
              <label>
                Telefone
                <input
                  required
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  minLength={10}
                />
              </label>
            </div>
            <h2>02. Endereço de entrega</h2>
            <div className="form-grid">
              <label>
                CEP
                <input
                  required
                  name="zip"
                  autoComplete="postal-code"
                  pattern="[0-9]{5}-?[0-9]{3}"
                  placeholder="00000-000"
                />
              </label>
              <label>
                Endereço
                <input required name="street" autoComplete="address-line1" />
              </label>
              <label>
                Número
                <input required name="number" />
              </label>
              <label>
                Complemento
                <input name="complement" autoComplete="address-line2" />
              </label>
              <label>
                Cidade
                <input required name="city" autoComplete="address-level2" />
              </label>
              <label>
                UF
                <select required name="state" autoComplete="address-level1">
                  <option value="">Selecione</option>
                  {"AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO"
                    .split(" ")
                    .map((uf) => (
                      <option key={uf}>{uf}</option>
                    ))}
                </select>
              </label>
            </div>
            <h2>03. Pagamento</h2>
            <div className="notice">
              <LockKeyhole size={21} />
              <div>
                <strong>Pagamento ainda não habilitado</strong>
                <p>
                  Pix, cartão, cálculo de frete e envio do pedido serão
                  conectados na próxima etapa. Nenhum dado deste formulário é
                  enviado.
                </p>
              </div>
            </div>
          </div>
          <aside className="order-summary">
            <h3>Resumo</h3>
            {cart.map((i) => (
              <div key={i.id}>
                <span>
                  {products.find((p) => p.id === i.productId)?.name}
                  <small> × {i.quantity}</small>
                </span>
                <strong>
                  {money(
                    (products.find((p) => p.id === i.productId)?.price || 0) *
                      i.quantity,
                  )}
                </strong>
              </div>
            ))}
            <hr />
            <div className="summary-total">
              <span>Estimativa</span>
              <strong>{money(total)}</strong>
            </div>
            <button className="button primary" type="submit">
              Revisar dados <ArrowRight size={17} />
            </button>
            {review && (
              <div className="notice success" role="status">
                <Check size={20} />
                <p>
                  Dados preenchidos. A demonstração termina aqui: pedido não
                  enviado e pagamento não realizado.
                </p>
              </div>
            )}
            <Link href="/carrinho" className="text-button">
              Voltar ao carrinho
            </Link>
          </aside>
        </form>
      )}
    </StoreShell>
  );
}
