import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyQualify, isQualified, qualifyMessage, routeFor, toCatalogTechnique } from "../lib/qualify.ts";
import { leadSchema } from "../lib/lead.ts";

test("poucas peças vão para o site; 30 ou mais, para a fabricação", () => {
  assert.equal(routeFor({ qty: "1-4" }), "minimo");
  assert.equal(routeFor({ qty: "5-9" }), "loja");
  assert.equal(routeFor({ qty: "10-29" }), "loja");
  assert.equal(routeFor({ qty: "30-99" }), "fabrica");
  assert.equal(routeFor({ qty: "300+" }), "fabrica");
  assert.equal(routeFor({ qty: null }), null);
});

test("com logo, precisa escolher a técnica", () => {
  const a = { ...emptyQualify("polo-pv-basica"), qty: "10-29" as const, custom: true };
  assert.equal(isQualified(a), false);
  assert.equal(isQualified({ ...a, technique: "bordado" }), true);
  assert.equal(isQualified({ ...a, custom: false }), true);
});

test("técnica do questionário vira a técnica do simulador", () => {
  assert.equal(toCatalogTechnique("sublimacao"), "Sublimação");
  assert.equal(toCatalogTechnique("nao-sei"), null);
});

test("mensagem da fabricação traz produto, quantidade, arte e opções da peça", () => {
  const m = qualifyMessage(
    { qty: "100-299", product: "polo-pv-basica", custom: true, technique: "bordado", fabric: ["gola", "botoes"] },
    "Polo PV Básica",
    { name: "Ana", company: "ACME" },
  );
  assert.match(m, /Ana \(ACME\)/);
  assert.match(m, /100 a 299 peças/);
  assert.match(m, /Logo\/arte: Bordado/);
  assert.match(m, /Gola, Botões/);
});

test("contato exige nome e WhatsApp com DDD", () => {
  const base = { product: "polo-pv-basica", qty: "10-29", route: "loja", custom: false };
  assert.equal(leadSchema.safeParse({ ...base, name: "Ana", phone: "(11) 98888-7777" }).success, true);
  assert.equal(leadSchema.safeParse({ ...base, name: "Ana", phone: "9888" }).success, false);
  assert.equal(leadSchema.safeParse({ ...base, name: "", phone: "11988887777" }).success, false);
});
