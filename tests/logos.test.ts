import { test } from "node:test";
import assert from "node:assert/strict";
import { lineLogos } from "../lib/pricing.ts";
import { emptyCompany, quoteRequestMessage } from "../lib/quote-message.ts";
import { cartLineSchema } from "../lib/validation.ts";

const a = { name: "frente.png", thumb: "data:image/png;base64,AA" };
const b = { name: "costas.png", thumb: "data:image/png;base64,BB" };

test("cada posição usa a própria logo", () => {
  const logos = lineLogos({ positions: ["frente", "costas"], logos: { frente: a, costas: b } });
  assert.deepEqual(logos, { frente: a, costas: b });
});

test("logo de posição desmarcada não entra", () => {
  assert.deepEqual(lineLogos({ positions: ["frente"], logos: { frente: a, costas: b } }), { frente: a });
});

test("carrinho antigo (uma logo) vale para todas as posições", () => {
  assert.deepEqual(lineLogos({ positions: ["frente", "manga"], logo: a }), { frente: a, manga: a });
});

test("checkout aceita logos por posição", () => {
  const r = cartLineSchema.safeParse({
    id: "x",
    slug: "polo-pv-basica",
    color: "marinho",
    sizes: { M: 10 },
    positions: ["frente", "costas"],
    logos: { frente: a, costas: b },
  });
  assert.equal(r.success, true);
});

test("mensagem do orçamento lista a logo de cada posição", () => {
  const msg = quoteRequestMessage(
    [{ slug: "polo-pv-basica", color: "marinho", qty: 30, positions: ["frente", "costas"] }],
    { ...emptyCompany, name: "Empresa", contact: "Ana", phone: "11", email: "a@b.c", city: "SP" },
    { frente: "frente.png" },
  );
  assert.match(msg, /Frente \(peito\): frente\.png/);
  assert.match(msg, /Costas[^:]*: envio nesta conversa/);
});
