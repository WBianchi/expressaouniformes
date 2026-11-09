"use client";
// Painel: contatos deixados no questionário. Serve para recuperar quem começou
// a simulação e não comprou, e para acompanhar os pedidos de fabricação.
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { getProduct } from "@/lib/catalog";
import { artTechniques, fabricOptions, qtyOptions } from "@/lib/qualify";
import { LEAD_STATUSES, type AdminLead, type LeadStatus } from "@/lib/lead-admin-types";
import { setLeadStatus } from "@/app/admin/lead-actions";
import s from "./LeadsAdmin.module.css";

const routeLabel = { minimo: "Abaixo do mínimo", loja: "Compra rápida (site)", fabrica: "Fabricação" } as const;
const statusLabel: Record<LeadStatus, string> = { novo: "Novo", contatado: "Contatado", convertido: "Comprou", perdido: "Perdido" };

function recoveryMessage(l: AdminLead) {
  const product = getProduct(l.product)?.name ?? l.product;
  const first = l.name.split(" ")[0];
  return l.route === "fabrica"
    ? `Olá, ${first}! Aqui é da Expressão Uniformes. Vi que você pediu um orçamento de ${product}. Posso te ajudar a montar o pedido?`
    : `Olá, ${first}! Aqui é da Expressão Uniformes. Vi que você começou a simular ${product} no nosso site. Ficou alguma dúvida? Posso te ajudar a finalizar.`;
}

const waLink = (phone: string, text: string) => `https://wa.me/${phone.startsWith("55") ? phone : `55${phone}`}?text=${encodeURIComponent(text)}`;

export function LeadsAdmin({ leads }: { leads: AdminLead[] | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"todos" | AdminLead["route"] | LeadStatus>("todos");

  const list = useMemo(
    () => (leads ?? []).filter((l) => filter === "todos" || l.route === filter || l.status === filter),
    [leads, filter],
  );

  if (!leads)
    return (
      <div className="admin-panel">
        <p className={s.note}>Banco de dados não configurado: os contatos não estão sendo guardados.</p>
      </div>
    );

  const change = (id: string, status: LeadStatus) =>
    start(async () => {
      setError(null);
      const r = await setLeadStatus(id, status);
      if (!r.ok) return setError(r.error);
      router.refresh();
    });

  const counts = {
    novo: leads.filter((l) => l.status === "novo").length,
    loja: leads.filter((l) => l.route === "loja").length,
    fabrica: leads.filter((l) => l.route === "fabrica").length,
  };

  return (
    <div className="admin-panel">
      <div className="panel-heading">
        <div>
          <h3>Contatos do questionário</h3>
          <p>
            Quem respondeu as perguntas de qualificação (landing pages e “Solicitar orçamento”). Chame no WhatsApp quem começou a simulação e não
            comprou, e marque o status para a equipe saber quem já foi atendido.
          </p>
        </div>
      </div>

      <div className={s.filters} role="group" aria-label="Filtrar contatos">
        {(
          [
            ["todos", `Todos (${leads.length})`],
            ["novo", `Novos (${counts.novo})`],
            ["loja", `Compra rápida (${counts.loja})`],
            ["fabrica", `Fabricação (${counts.fabrica})`],
            ["convertido", "Compraram"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" aria-pressed={filter === id} className={s.filter} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </div>

      {error && <p className={s.error}>{error}</p>}
      {!list.length && <p className={s.note}>Nenhum contato por aqui ainda.</p>}

      <ul className={s.list} aria-busy={pending}>
        {list.map((l) => {
          const technique = artTechniques.find((t) => t.id === l.technique)?.label;
          const fabric = l.fabric.map((f) => fabricOptions.find((o) => o.id === f)?.label).filter(Boolean);
          return (
            <li key={l.id} className={s.item} data-status={l.status}>
              <div className={s.main}>
                <div className={s.top}>
                  <strong>{l.name}</strong>
                  {l.company && <span className={s.company}>{l.company}</span>}
                  <span className={s.route} data-route={l.route}>
                    {routeLabel[l.route]}
                  </span>
                </div>
                <p className={s.meta}>
                  {getProduct(l.product)?.name ?? l.product} · {qtyOptions.find((o) => o.id === l.qty)?.label ?? l.qty} ·{" "}
                  {l.custom ? `logo: ${technique ?? "a definir"}` : "sem logo"}
                  {fabric.length > 0 && ` · peça: ${fabric.join(", ")}`}
                </p>
                <p className={s.meta}>
                  {new Date(l.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  {l.email && ` · ${l.email}`}
                  {l.source && ` · origem: ${l.source}`}
                </p>
              </div>
              <div className={s.actions}>
                <a className="button primary small" href={waLink(l.phone, recoveryMessage(l))} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={15} /> WhatsApp
                </a>
                <select value={l.status} onChange={(e) => change(l.id, e.target.value as LeadStatus)} disabled={pending} aria-label={`Status de ${l.name}`}>
                  {LEAD_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {statusLabel[st]}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
