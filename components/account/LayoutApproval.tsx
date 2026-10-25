"use client";
import { useState } from "react";
import { CheckCircle2, Clock, MessageSquareText, PenLine, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { getProduct } from "@/lib/catalog";
import { LogoMockup } from "@/components/product/LogoMockup";
import { logoThumbs, useBrandLogos } from "@/components/product/useBrandLogo";
import { formatDate } from "./Orders";
import type { LayoutStatus, Order } from "./storage";
import s from "./Account.module.css";

const statusInfo: Record<LayoutStatus, { label: string; tone: string; text: string }> = {
  aguardando: { label: "Em preparação", tone: "chip", text: "Nossa equipe está preparando o layout com a sua logo. Você será avisado quando estiver pronto." },
  enviado: { label: "Aguardando sua aprovação", tone: "chip chip-brand", text: "Confira posição, tamanho e cores da logo. Ao aprovar, o pedido segue para produção." },
  ajuste: { label: "Ajuste solicitado", tone: "chip chip-gold", text: "Recebemos seu pedido de ajuste. Um novo layout será enviado em breve — você ainda pode aprovar esta versão." },
  aprovado: { label: "Layout aprovado", tone: "chip chip-success", text: "Tudo certo! Seu pedido está liberado para produção." },
};

export function LayoutApproval({
  orders,
  selectedId,
  onSelect,
  onUpdate,
}: {
  orders: Order[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, layout: NonNullable<Order["layout"]>) => void;
}) {
  const [brandLogos] = useBrandLogos();
  const [adjusting, setAdjusting] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const order = orders.find((o) => o.id === selectedId) ?? orders[0];

  if (!order) {
    return (
      <div className={s.empty}>
        <Clock size={28} strokeWidth={1.5} />
        <strong>Nenhum layout por aqui ainda</strong>
        <p>Depois do pagamento, enviamos o layout com a sua logo para aprovação nesta página.</p>
      </div>
    );
  }

  const layout = order.layout ?? { status: "aguardando" as const, comments: [] };
  const info = statusInfo[layout.status] ?? statusInfo.aguardando;
  const canAct = layout.status === "enviado" || layout.status === "ajuste";
  const item = order.items[0];
  const product = item ? getProduct(item.slug) : undefined;

  const approve = () => {
    onUpdate(order.id, { ...layout, status: "aprovado" });
    setAdjusting(false);
    toast.success("Layout aprovado!", { description: order.sample ? "Pedido de exemplo: nada foi enviado." : "Seu pedido segue para produção." });
  };
  const requestAdjust = () => {
    const c = comment.trim();
    if (c.length < 5) {
      setError("Descreva o ajuste em pelo menos 5 caracteres.");
      return;
    }
    onUpdate(order.id, { ...layout, status: "ajuste", comments: [...(layout.comments ?? []), c] });
    setComment("");
    setError("");
    setAdjusting(false);
    toast.success("Pedido de ajuste enviado", { description: order.sample ? "Pedido de exemplo: nada foi enviado." : "Responderemos com um novo layout em breve." });
  };

  return (
    <div className={s.approval}>
      {orders.length > 1 && (
        <div className={s.orderPicker}>
          <label htmlFor="layout-order">Pedido</label>
          <select id="layout-order" className="input" value={order.id} onChange={(e) => onSelect(e.target.value)}>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                #{o.id} · {formatDate(o.createdAt)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={s.approvalGrid}>
        <figure className={s.layoutView}>
          {layout.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={layout.imageUrl} alt={`Layout do pedido #${order.id}`} />
          ) : (
            <div className={s.layoutPlaceholder}>
              {product && <LogoMockup product={product} view="front" positions={["frente"]} logos={logoThumbs(brandLogos)} />}
              <span className={s.placeholderTag}>{layout.status === "aguardando" ? "Layout em preparação" : "Prévia — o layout final aparece aqui"}</span>
            </div>
          )}
          <figcaption>
            Pedido #{order.id}
            {order.sample && " · exemplo"}
          </figcaption>
        </figure>

        <div className={s.approvalSide}>
          <span className={info.tone}>{info.label}</span>
          <p className={s.approvalText}>{info.text}</p>

          {canAct && (
            <ul className={s.checklist}>
              <li>Logo legível e no tamanho esperado</li>
              <li>Posição (frente, costas, manga) correta</li>
              <li>Cores da peça e da logo conferidas</li>
            </ul>
          )}

          {(layout.comments?.length ?? 0) > 0 && (
            <div className={s.comments}>
              <strong>
                <MessageSquareText size={15} /> Seus comentários
              </strong>
              <ul>
                {layout.comments!.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {canAct && !adjusting && (
            <div className={s.approvalActions}>
              <button type="button" className="btn btn-accent btn-block" onClick={approve}>
                <ThumbsUp size={17} /> Aprovar layout
              </button>
              <button type="button" className="btn btn-outline btn-block" onClick={() => setAdjusting(true)}>
                <PenLine size={17} /> Solicitar ajuste
              </button>
            </div>
          )}

          {canAct && adjusting && (
            <div className={s.adjust}>
              <label htmlFor="adjust-text">O que precisa mudar?</label>
              <textarea
                id="adjust-text"
                className="input"
                rows={4}
                autoFocus
                maxLength={600}
                value={comment}
                placeholder="Ex.: aumentar a logo em 1 cm e usar a versão branca nas costas."
                onChange={(e) => {
                  setComment(e.target.value);
                  if (error) setError("");
                }}
                aria-invalid={!!error}
                aria-describedby={error ? "adjust-err" : undefined}
              />
              {error && (
                <span className={s.error} id="adjust-err" role="alert">
                  {error}
                </span>
              )}
              <div className={s.approvalActions}>
                <button type="button" className="btn btn-primary btn-block" onClick={requestAdjust}>
                  Enviar pedido de ajuste
                </button>
                <button type="button" className="btn btn-ghost btn-block" onClick={() => setAdjusting(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {layout.status === "aprovado" && (
            <p className={s.approvedNote}>
              <CheckCircle2 size={18} /> Aprovado. Acompanhe a produção em Pedidos.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
