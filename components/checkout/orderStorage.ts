// Persistência local do pedido concluído (a área Minha conta lê `eu-orders`).
import type { CheckoutResponse, StoredOrder } from "@/lib/orders";
import { toStoredOrder } from "@/lib/orders";

export const ORDERS_KEY = "eu-orders";
const sessionKey = (id: string) => `eu-order-${id}`;

/** Grava o resumo em `eu-orders` e o retorno completo (QR Code, boleto) para a página do pedido. */
export function saveCompletedOrder(r: CheckoutResponse) {
  const stored = toStoredOrder(r);
  try {
    const raw = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    const list: StoredOrder[] = Array.isArray(raw) ? raw.filter((o) => o && o.id !== stored.id) : [];
    localStorage.setItem(ORDERS_KEY, JSON.stringify([stored, ...list].slice(0, 50)));
  } catch {
    /* armazenamento indisponível */
  }
  const json = JSON.stringify(r);
  try {
    sessionStorage.setItem(sessionKey(r.orderId), json);
  } catch {
    /* ignora */
  }
  try {
    localStorage.setItem(sessionKey(r.orderId), json);
  } catch {
    /* QR Code grande demais para o armazenamento: fica só na sessão */
  }
}

export function readCompletedOrder(id: string): CheckoutResponse | null {
  for (const store of [() => sessionStorage, () => localStorage]) {
    try {
      const raw = store().getItem(sessionKey(id));
      if (raw) {
        const r = JSON.parse(raw) as CheckoutResponse;
        if (r && r.orderId === id && r.payment && r.quote) return r;
      }
    } catch {
      /* ignora */
    }
  }
  return null;
}

/** Último recurso: resumo salvo em `eu-orders` (sem QR Code). */
export function readStoredOrder(id: string): StoredOrder | null {
  try {
    const raw = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    return Array.isArray(raw) ? (raw.find((o: StoredOrder) => o?.id === id) ?? null) : null;
  } catch {
    return null;
  }
}

/** Atualiza o status salvo neste navegador quando o Asaas confirma (ou cancela) o pagamento. */
export function updateStoredOrderStatus(id: string, live: { status: string; paymentStatus: string; invoiceUrl?: string }) {
  try {
    const raw = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    if (!Array.isArray(raw)) return;
    const next = raw.map((o: StoredOrder) =>
      o?.id === id
        ? {
            ...o,
            // não sobrescreve etapas posteriores ao pagamento (layout, produção, envio)
            status: ["aguardando_pagamento", "em_analise", "vencido"].includes(o.status) ? live.status : o.status,
            payment: { ...o.payment, method: o.payment?.method ?? "", status: live.paymentStatus, invoiceUrl: live.invoiceUrl ?? o.payment?.invoiceUrl },
          }
        : o,
    );
    localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
  } catch {
    /* armazenamento indisponível */
  }
  for (const store of [() => sessionStorage, () => localStorage]) {
    try {
      const raw = store().getItem(sessionKey(id));
      if (!raw) continue;
      const r = JSON.parse(raw) as CheckoutResponse;
      r.status = live.status as CheckoutResponse["status"];
      r.payment = { ...r.payment, status: live.paymentStatus as CheckoutResponse["payment"]["status"] };
      store().setItem(sessionKey(id), JSON.stringify(r));
    } catch {
      /* ignora */
    }
  }
}
