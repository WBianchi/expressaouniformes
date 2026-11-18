"use client";
// Painel → Personalizações: fila das artes recebidas em cada pedido. A fábrica vê a logo
// aplicada na peça, baixa o arquivo, aprova (o pedido segue para a produção) ou pede ajuste
// (abre o WhatsApp do cliente com a mensagem pronta).
import { useState } from "react";
import {
  CheckCircle2,
  Download,
  MessageCircle,
  RotateCcw,
  Wrench,
} from "lucide-react";
import {
  colors,
  getProduct,
  positionFees,
  tintFor,
  type Position,
} from "@/lib/catalog";
import { cmText, logoBox, logoSpots, type View } from "@/lib/mockup";
import { useLogoAspects } from "@/components/product/useLogoAspect";
import {
  adjustmentMessage,
  artStatusInfo,
  customerWhatsapp,
  type ArtStatus,
} from "@/lib/art";
import type { AdminOrder } from "@/lib/order-lookup";
import { setArtStatus } from "@/app/admin/art-actions";
import { LogoMockup } from "@/components/product/LogoMockup";
import { useAction } from "./MediaAdmin";
import m from "./MediaAdmin.module.css";
import s from "./ArtQueue.module.css";

type Item = AdminOrder["items"][number];

/** Pedido sem nenhuma posição de logo vai direto para a produção. */
export const needsArt = (o: AdminOrder) =>
  o.source === "asaas" || o.items.some((i) => (i.positions ?? []).length > 0);
export const artApproved = (o: AdminOrder) =>
  !needsArt(o) || o.art?.status === "aprovada";

const CLOSED = ["vencido", "recusado", "cancelado", "estornado"];
const paymentLabel: Record<
  string,
  [string, "amber" | "blue" | "green" | "red"]
> = {
  aguardando_pagamento: ["Aguardando pagamento", "amber"],
  em_analise: ["Pagamento em análise", "blue"],
  pago: ["Pago", "green"],
};

/** Nome para salvar a prévia: o nome do arquivo do cliente com a extensão da prévia (webp ou png). */
const previewName = (name: string, thumb: string) =>
  `previa-${name.replace(/\.[a-z0-9]{2,4}$/i, "")}.${thumb.startsWith("data:image/webp") ? "webp" : "png"}`;

/** A logo aplicada em cada lado da peça e os arquivos de cada posição, para baixar. */
export function ItemArt({ item }: { item: Item }) {
  const product = item.slug ? getProduct(item.slug) : undefined;
  const positions = item.positions ?? [];
  const thumbs = Object.fromEntries(
    Object.entries(item.logos ?? {}).map(([p, l]) => [p, l?.thumb]),
  );
  const views = product
    ? (["front", "back", "side", "side-flip"] as View[]).filter((v) =>
        positions.some((p) => logoSpots(product)[p]?.view === v),
      )
    : [];
  // tamanho real da logo em cada posição (a altura sai da proporção da imagem)
  const aspectOf = useLogoAspects(positions.map((p) => item.logos?.[p]?.thumb));
  const size = (p: Position) => {
    const spot = product && logoSpots(product, item.technique)[p];
    const logo = item.logos?.[p];
    if (!spot || !logo) return "";
    const box = logoBox(spot, item.placements?.[p], aspectOf(logo.thumb));
    return ` · ${cmText(box.w)} × ${cmText(box.hCm)} cm`;
  };
  // a peça na cor do pedido (o item guarda o nome da cor)
  const tint = product
    ? tintFor(product, colors.find((c) => c.name === item.color)?.id)
    : null;
  return (
    <div className={s.item}>
      {product && views.length > 0 && (
        <span className={s.mockups}>
          {views.map((v) => (
            <span key={v} className={s.mockup}>
              <LogoMockup
                product={product}
                view={v}
                positions={positions}
                logos={thumbs}
                placements={item.placements}
                markers={false}
                tint={tint}
                technique={item.technique}
              />
            </span>
          ))}
        </span>
      )}
      <ul className={s.files}>
        {positions.map((p: Position) => {
          const logo = item.logos?.[p];
          return (
            <li key={p}>
              <span>
                <b>{positionFees[p].label}</b>
                {size(p)}
                {item.placements?.[p] ? " · posição ajustada pelo cliente" : ""}
                <small>
                  {logo ? logo.name : "Sem logo: o cliente ainda vai enviar"}
                </small>
              </span>
              {logo?.url ? (
                <a
                  className="button secondary small"
                  href={`${logo.url}?download=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download size={14} /> Arquivo original
                </a>
              ) : logo ? (
                <a
                  className="button secondary small"
                  href={logo.thumb}
                  download={previewName(logo.name, logo.thumb)}
                  title="O pedido guardou só a prévia (até 400 px). Peça o arquivo original ao cliente se precisar."
                >
                  <Download size={14} /> Prévia (baixa resolução)
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
      <small className={s.technique}>
        Aplicação: {item.technique ?? "a definir no layout"}
      </small>
    </div>
  );
}

export function ArtQueue({
  orders,
  enabled,
}: {
  orders: AdminOrder[];
  enabled: boolean;
}) {
  const [tab, setTab] = useState<ArtStatus>("revisao");
  const queue = orders.filter(
    (o) => o.source === "db" && !CLOSED.includes(o.status) && needsArt(o),
  );
  const by = (st: ArtStatus) =>
    queue.filter((o) => (o.art?.status ?? "revisao") === st);
  const list = by(tab);

  return (
    <div className="admin-panel">
      <div className="panel-heading">
        <div>
          <h3>Artes dos pedidos</h3>
          <p>
            Confira a logo de cada pedido na peça, baixe o arquivo e aprove para
            seguir para a produção, ou peça um ajuste ao cliente.
          </p>
        </div>
      </div>
      <div className={s.body}>
        {!enabled && (
          <p className={m.note}>
            Banco de dados não configurado: as artes dos pedidos ficam guardadas
            no banco.
          </p>
        )}
        <div className={s.tabs} role="tablist" aria-label="Situação da arte">
          {(Object.keys(artStatusInfo) as ArtStatus[]).map((st) => (
            <button
              key={st}
              type="button"
              role="tab"
              aria-selected={tab === st}
              onClick={() => setTab(st)}
            >
              {st === "aprovada" ? "Aprovadas" : artStatusInfo[st].label}
              <b>{by(st).length}</b>
            </button>
          ))}
        </div>
        <div className={s.list}>
          {list.map((o) => (
            <ArtOrder key={o.id} order={o} enabled={enabled} />
          ))}
          {!list.length && (
            <p className="empty-state">
              {tab === "revisao"
                ? "Nenhuma arte aguardando revisão."
                : tab === "ajuste"
                  ? "Nenhum pedido aguardando arte ajustada do cliente."
                  : "Nenhuma arte aprovada ainda."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ArtOrder({
  order: o,
  enabled,
}: {
  order: AdminOrder;
  enabled: boolean;
}) {
  const { pending, error, run } = useAction();
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState(o.art?.note ?? "");
  const status = o.art?.status ?? "revisao";
  const [payLabel, payTone] = paymentLabel[o.status] ?? [o.status, "blue"];
  const items = o.items.filter((i) => (i.positions ?? []).length > 0);
  const whatsapp = (text: string) =>
    customerWhatsapp(
      o.customer.phone,
      adjustmentMessage({ name: o.customer.name, orderId: o.id, note: text }),
    );
  const lastAsk =
    status === "ajuste" && o.art?.note ? whatsapp(o.art.note) : null;

  const ask = () => {
    const text = note.trim();
    if (!text) return;
    // abre o WhatsApp no clique (fora dele o navegador bloqueia a nova aba) e grava o pedido de ajuste
    const link = whatsapp(text);
    if (link) window.open(link, "_blank", "noopener,noreferrer");
    run(
      () => setArtStatus(o.id, "ajuste", text),
      () => setAsking(false),
    );
  };

  return (
    <article className={s.order} aria-busy={pending}>
      <header className={s.orderHead}>
        <div>
          <strong>#{o.id}</strong>
          <span>
            {o.customer.name} ·{" "}
            {new Date(o.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
            })}{" "}
            · {o.items.reduce((a, i) => a + i.qty, 0)} peças
          </span>
        </div>
        <div className={s.chips}>
          <span className={`status ${payTone}`}>{payLabel}</span>
          <span className={`status ${artStatusInfo[status].tone}`}>
            {artStatusInfo[status].label}
          </span>
        </div>
      </header>

      {items.map((i, k) => (
        <div key={k} className={s.line}>
          <p className={s.lineName}>
            {i.qty}x {i.name}
            {i.color ? ` · ${i.color}` : ""}
          </p>
          <ItemArt item={i} />
        </div>
      ))}
      {o.notes && <p className={s.notes}>Observações do cliente: {o.notes}</p>}
      {status === "ajuste" && o.art?.note && (
        <p className={s.asked}>
          <Wrench size={14} /> Ajuste pedido
          {o.art.updatedAt
            ? ` em ${new Date(o.art.updatedAt).toLocaleDateString("pt-BR")}`
            : ""}
          : {o.art.note}
        </p>
      )}
      {status !== "aprovada" && o.status !== "pago" && (
        <p className={s.warn}>
          Pagamento ainda não confirmado: dá para aprovar a arte, mas a produção
          só começa depois do pagamento.
        </p>
      )}

      {asking ? (
        <div className={s.ask}>
          <label className={m.field}>
            O que precisa ajustar na arte?
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Ex.: a logo veio com fundo branco. Pode enviar em PNG com fundo transparente ou em PDF/SVG?"
              autoFocus
            />
          </label>
          <p className={s.hint}>
            {customerWhatsapp(o.customer.phone, "x")
              ? 'Ao confirmar, o WhatsApp do cliente abre com a mensagem pronta, e o pedido vai para "Ajuste pedido".'
              : "O pedido não tem um celular válido: o ajuste fica registrado, mas fale com o cliente por e-mail."}
          </p>
          <div className="button-row">
            <button
              type="button"
              className="button primary small"
              disabled={!note.trim() || pending || !enabled}
              onClick={ask}
            >
              <MessageCircle size={15} />{" "}
              {customerWhatsapp(o.customer.phone, "x")
                ? "Pedir ajuste no WhatsApp"
                : "Registrar ajuste"}
            </button>
            <button
              type="button"
              className="button secondary small"
              onClick={() => setAsking(false)}
              disabled={pending}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="button-row">
          {status !== "aprovada" && (
            <button
              type="button"
              className="button primary small"
              disabled={pending || !enabled}
              onClick={() => run(() => setArtStatus(o.id, "aprovada"))}
            >
              <CheckCircle2 size={15} /> Aprovar arte
            </button>
          )}
          {status !== "aprovada" && (
            <button
              type="button"
              className="button secondary small"
              disabled={pending || !enabled}
              onClick={() => setAsking(true)}
            >
              <Wrench size={15} />{" "}
              {status === "ajuste" ? "Pedir outro ajuste" : "Pedir ajuste"}
            </button>
          )}
          {lastAsk && (
            <a
              className="button secondary small"
              href={lastAsk}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={15} /> Reabrir conversa
            </a>
          )}
          {status !== "revisao" && (
            <button
              type="button"
              className="button secondary small"
              disabled={pending || !enabled}
              onClick={() => run(() => setArtStatus(o.id, "revisao"))}
            >
              <RotateCcw size={15} /> Voltar para revisão
            </button>
          )}
          {o.customer.email && (
            <a
              className="text-button"
              href={`mailto:${o.customer.email}?subject=${encodeURIComponent(`Arte do pedido ${o.id}`)}`}
            >
              E-mail do cliente
            </a>
          )}
        </div>
      )}
      {error && <p className={m.error}>{error}</p>}
    </article>
  );
}
