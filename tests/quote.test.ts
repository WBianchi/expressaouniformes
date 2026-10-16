import { test } from "node:test";
import assert from "node:assert/strict";
import { isComplete, isEligible, quoteMessage, type QuoteAnswers } from "../lib/quote.ts";

const answers = (patch: Partial<QuoteAnswers> = {}): QuoteAnswers => ({
  quantity: "50-99",
  employees: "11-30",
  ...patch,
});

test("pedido abaixo de 30 peças vai para a linha de estoque", () => {
  assert.equal(isEligible(answers({ quantity: "ate-29" })), false);
  assert.equal(isEligible(answers({ quantity: "30-49" })), true);
  assert.equal(isEligible(answers({ quantity: null })), false);
});

test("questionário só conclui com as duas respostas", () => {
  assert.equal(isComplete(answers()), true);
  assert.equal(isComplete(answers({ employees: null })), false);
  assert.equal(isComplete(answers({ quantity: null })), false);
});

test("mensagem ao consultor leva as respostas", () => {
  const m = quoteMessage(answers());
  assert.match(m, /50 a 99/);
  assert.match(m, /11 a 30/);
  assert.doesNotMatch(m, /Personaliza/);
});
