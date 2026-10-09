"use client";
import type { CardBrand } from "@/lib/orders";
import s from "./Checkout.module.css";

const brandLabel: Record<CardBrand, string> = {
  visa: "VISA",
  mastercard: "mastercard",
  amex: "AMEX",
  elo: "elo",
  hipercard: "Hipercard",
  diners: "Diners",
  discover: "Discover",
  jcb: "JCB",
  unknown: "",
};

/** Cartão ilustrativo animado: vira para mostrar o CVV. Nada aqui é enviado ou armazenado. */
export function CardPreview({
  number,
  holder,
  expiry,
  ccv,
  brand,
  flipped,
}: {
  number: string;
  holder: string;
  expiry: string;
  ccv: string;
  brand: CardBrand;
  flipped: boolean;
}) {
  const amex = brand === "amex";
  const template = amex ? "•••• •••••• •••••" : "•••• •••• •••• ••••";
  const shown = template
    .split("")
    .map((ch, i) => (number[i] && ch !== " " ? number[i] : ch))
    .join("");
  return (
    <div className={s.cardScene} aria-hidden>
      <div className={s.card3d} data-flipped={flipped || undefined} data-brand={brand}>
        <div className={`${s.cardFace} ${s.cardFront}`}>
          <div className={s.cardTop}>
            <span className={s.chip} />
            <span className={s.brand} key={brand}>{brandLabel[brand]}</span>
          </div>
          <div className={s.cardNumber}>{shown}</div>
          <div className={s.cardBottom}>
            <div>
              <small>Titular</small>
              <span>{holder.trim() ? holder.toUpperCase().slice(0, 26) : "NOME COMO NO CARTÃO"}</span>
            </div>
            <div>
              <small>Validade</small>
              <span>{expiry || "MM/AA"}</span>
            </div>
          </div>
        </div>
        <div className={`${s.cardFace} ${s.cardBack}`}>
          <span className={s.stripe} />
          <div className={s.ccvRow}>
            <span className={s.signature} />
            <span className={s.ccv}>{ccv ? ccv.replace(/./g, "•") : "CVV"}</span>
          </div>
          <span className={s.backBrand}>{brandLabel[brand]}</span>
        </div>
      </div>
    </div>
  );
}
