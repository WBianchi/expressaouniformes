"use client";
import Link from "next/link";
import { Check, ExternalLink, FileCheck2, Package } from "lucide-react";
import { getColor, money } from "@/lib/catalog";
import { orderStage, orderStatusLabel, paymentLabel, timelineSteps, type Order } from "./storage";
import s from "./Account.module.css";

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
};

export function Timeline({ order }: { order: Order }) {
  const stage = orderStage(order);
  return (
    <ol className={s.timeline} aria-label="Andamento do pedido">
      {timelineSteps.map((label, i) => {
        const state = i <= stage ? "done" : i === stage + 1 ? "current" : "todo";
        return (
          <li key={label} data-state={state} aria-current={state === "current" ? "step" : undefined}>
            <span className={s.tlDot}>{state === "done" ? <Check size={12} strokeWidth={3} /> : i + 1}</span>
            <span className={s.tlLabel}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function StatusChip({ order }: { order: Order }) {
  const st = orderStatusLabel(order);
  return <span className={`chip chip-${st.tone}`}>{st.label}</span>;
}

export function OrderCard({ order, onReviewLayout }: { order: Order; onReviewLayout?: (id: string) => void }) {
  const qty = order.items.reduce((a, i) => a + (i.qty || 0), 0);
  const awaitingApproval = order.layout?.status === "enviado" || order.layout?.status === "ajuste";
  return (
    <article className={s.order}>
      <header className={s.orderHead}>
        <div>
          <div className={s.orderId}>
            <Package size={16} strokeWidth={1.75} />
            <strong>Pedido #{order.id}</strong>
            {order.sample && <span className="chip">Exemplo</span>}
          </div>
          <span className={s.orderMeta}>
            {formatDate(order.createdAt)} · {qty} peças · {paymentLabel(order.payment?.method)}
          </span>
        </div>
        <div className={s.orderRight}>
          <StatusChip order={order} />
          <strong className={s.orderTotal}>{money(order.total || 0)}</strong>
        </div>
      </header>

      <ul className={s.items}>
        {order.items.map((it, i) => (
          <li key={`${it.slug}-${i}`}>
            <span className={s.dot} style={{ background: getColor(it.color)?.hex ?? "var(--surface-3)" }} title={getColor(it.color)?.name ?? it.color} />
            <span className={s.itemName}>{it.name}</span>
            <span className={s.itemQty}>
              {it.qty} un. · {getColor(it.color)?.name ?? it.color}
            </span>
          </li>
        ))}
      </ul>

      <Timeline order={order} />

      <footer className={s.orderFoot}>
        {awaitingApproval && onReviewLayout && (
          <button type="button" className="btn btn-accent btn-sm" onClick={() => onReviewLayout(order.id)}>
            <FileCheck2 size={16} /> Revisar layout
          </button>
        )}
        {order.payment?.invoiceUrl && (
          <a href={order.payment.invoiceUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
            {order.payment.status && /pago|paid|received|confirm/i.test(order.payment.status) ? "Ver comprovante" : "Pagar / ver fatura"} <ExternalLink size={14} />
          </a>
        )}
        {!order.sample && (
          <Link href={`/pedido/${encodeURIComponent(order.id)}`} className="btn btn-ghost btn-sm">
            Detalhes do pedido
          </Link>
        )}
      </footer>
    </article>
  );
}
