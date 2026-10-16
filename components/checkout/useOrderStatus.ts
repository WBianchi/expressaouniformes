"use client";
import { useEffect, useState } from "react";
import type { OrderStatus, PaymentStatus } from "@/lib/orders";

export type LiveStatus = { status: OrderStatus; paymentStatus: PaymentStatus; invoiceUrl?: string };

export async function fetchOrderStatus(id: string, signal?: AbortSignal): Promise<LiveStatus | null> {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, { cache: "no-store", signal });
  return res.ok ? ((await res.json()) as LiveStatus) : null;
}

const FINAL: PaymentStatus[] = ["pago", "cancelado", "estornado", "recusado"];

/**
 * Acompanha o pagamento no Asaas: consulta a cada `interval` ms enquanto estiver pendente
 * (Pix cai em segundos; boleto pode levar dias, então para depois de ~15 min).
 */
export function useOrderStatus(id: string, enabled: boolean, interval = 6000) {
  const [live, setLive] = useState<LiveStatus | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    let timer: number | undefined;
    let tries = 0;
    const tick = async () => {
      try {
        const s = await fetchOrderStatus(id, ctrl.signal);
        if (s) setLive(s);
        if (s && FINAL.includes(s.paymentStatus)) return;
      } catch {
        if (ctrl.signal.aborted) return;
      }
      if (++tries < 150) timer = window.setTimeout(tick, interval);
    };
    tick();
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [id, enabled, interval]);
  return live;
}
