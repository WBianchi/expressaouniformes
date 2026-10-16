import { test } from "node:test";
import assert from "node:assert/strict";
import { frenetItems, mapFrenetServices, PICKUP } from "../lib/shipping.ts";
import { computeQuote, orderDescription, parseDescription } from "../lib/orders.ts";
import type { CartLine } from "../lib/pricing.ts";

const services = [
  { ServiceCode: "03220", ServiceDescription: "Sedex", Carrier: "Correios", ShippingPrice: "19.06", DeliveryTime: "1", Error: false },
  { ServiceCode: "F_3", ServiceDescription: "Jadlog Package", Carrier: "Jadlog", ShippingPrice: "23.4436", DeliveryTime: "5", Error: false },
  { ServiceCode: "03298", ServiceDescription: "PAC", Carrier: "Correios", ShippingPrice: "26.41", DeliveryTime: "5", Error: false },
  { ServiceCode: "04227", ServiceDescription: "Mini Envios", Carrier: "Correios", Error: true, Msg: "excede o limite" },
];

test("cotação Frenet vira opções ordenadas, sem erros e com retirada", () => {
  const o = mapFrenetServices(services, 300);
  assert.deepEqual(o.map((x) => x.id), ["f-03220", "f-F_3", "f-03298", "retirada"]);
  assert.equal(o[0].label, "Correios Sedex");
  assert.equal(o[1].label, "Jadlog Package");
  assert.equal(o[1].price, 23.44);
  assert.equal(o[0].days, "1 dia útil após o envio");
  assert.deepEqual(o.at(-1), PICKUP);
});

test("frete grátis na opção mais barata a partir de R$ 799", () => {
  const o = mapFrenetServices(services, 900);
  assert.equal(o[0].price, 0);
  assert.match(o[0].label, /grátis/);
  assert.equal(o[1].price, 23.44);
});

test("volumes por categoria e quantidade", () => {
  const items = frenetItems([{ slug: "polo-pv-basica", sizes: { M: 6, G: 4 } }]);
  assert.equal(items[0].Quantity, 10);
  assert.equal(items[0].Weight, 0.25);
});

const line: CartLine = { id: "a", slug: "polo-pv-basica", color: "marinho", sizes: { M: 10 }, positions: ["frente"] };

test("checkout usa a opção cotada no servidor e recusa id desconhecido", () => {
  const options = mapFrenetServices(services, 300);
  const q = computeQuote({ lines: [line], cep: "01310100", shippingId: "f-F_3", shippingOptions: options, method: "boleto" });
  assert.ok(q.ok && q.quote.shipping.price === 23.44);
  assert.ok(!computeQuote({ lines: [line], cep: "01310100", shippingId: "f-XYZ", shippingOptions: options, method: "boleto" }).ok);
});

test("descrição da cobrança guarda os itens e o painel lê de volta", () => {
  const q = computeQuote({ lines: [line], cep: "01310100", shippingId: "retirada", shippingOptions: [PICKUP], method: "pix" });
  assert.ok(q.ok);
  const desc = orderDescription("EU-261015-ABCDE", q.quote);
  assert.ok(desc.length <= 500);
  const parsed = parseDescription(desc);
  assert.equal(parsed.items[0].qty, 10);
  assert.match(parsed.items[0].name, /Polo/);
  assert.equal(parsed.shipping, "Retirar na fábrica");
});
