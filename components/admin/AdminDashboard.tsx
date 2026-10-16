"use client";
import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Shirt,
  Users,
  ChartNoAxesCombined,
  Image,
  Star,
  Ticket,
  Plug,
  FileChartColumn,
  Settings,
  MessagesSquare,
  Megaphone,
  Send,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Search,
  ArrowUpRight,
  ArrowRight,
  Palette,
  Factory,
  ExternalLink,
  Package,
  Clock,
  CheckCircle2,
  X,
  Globe,
} from "lucide-react";
import { products, money, getColor } from "@/lib/catalog";
import type { AdminOrder, OrdersResult } from "@/lib/order-lookup";
import { logout } from "@/app/admin/actions";
const navigation = [
  ["Visão geral", LayoutDashboard],
  ["Pedidos", ShoppingBag],
  ["Produtos", Shirt],
  ["Personalizações", Palette],
  ["Produção", Factory],
  ["Clientes", Users],
  ["Tráfego", ChartNoAxesCombined],
  ["Banners", Image],
  ["Avaliações", Star],
  ["Cupons", Ticket],
  ["Integrações", Plug],
  ["Relatórios", FileChartColumn],
  ["Configurações", Settings],
  ["Chat ao vivo", MessagesSquare],
  ["Promoções", Megaphone],
  ["Disparos", Send],
] as const;
type Row = {
  id: string;
  company: string;
  initial: string;
  product: string;
  quantity: number;
  status: string;
  tone: "amber" | "blue" | "green" | "red";
  total: number;
  date: string;
  order: AdminOrder;
};

const statusInfo: Record<string, [string, Row["tone"]]> = {
  aguardando_pagamento: ["Aguardando pagamento", "amber"],
  em_analise: ["Pagamento em análise", "blue"],
  pago: ["Pago · aguardando arte", "green"],
  vencido: ["Vencido", "red"],
  recusado: ["Recusado", "red"],
  cancelado: ["Cancelado", "red"],
  estornado: ["Estornado", "red"],
};
const methodName = { pix: "Pix", boleto: "Boleto", cartao: "Cartão" } as const;

const toRow = (o: AdminOrder): Row => {
  const [status, tone] = statusInfo[o.status] ?? [o.status, "blue"];
  const words = o.customer.name.trim().split(/\s+/);
  return {
    id: o.id,
    company: o.customer.name,
    initial:
      ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "EU",
    product: o.items.length
      ? o.items.length > 1
        ? `${o.items[0].name} +${o.items.length - 1}`
        : o.items[0].name
      : o.summary.slice(0, 40),
    quantity: o.items.reduce((a, i) => a + i.qty, 0),
    status,
    tone,
    total: o.total,
    date: new Date(o.createdAt).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
    order: o,
  };
};

/** Linha da receita paga por dia (30 dias) no viewBox 600×180. */
function revenueChart(paid: AdminOrder[]) {
  const days = 30;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totals = Array.from({ length: days }, () => 0);
  for (const o of paid) {
    const d = new Date(o.createdAt);
    d.setHours(0, 0, 0, 0);
    const idx =
      days - 1 - Math.round((today.getTime() - d.getTime()) / 86_400_000);
    if (idx >= 0 && idx < days) totals[idx] += o.total;
  }
  const max = Math.max(1000, ...totals);
  const line = totals
    .map(
      (v, i) =>
        `${i ? "L" : "M"}${((i / (days - 1)) * 600).toFixed(1)} ${(170 - (v / max) * 155).toFixed(1)}`,
    )
    .join(" ");
  const labels = [29, 23, 17, 11, 5, 0].map((ago) =>
    new Date(today.getTime() - ago * 86_400_000)
      .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
      .replace(".", ""),
  );
  return { line, max, labels };
}

export type Integrations = {
  asaas: "production" | "sandbox" | "demo";
  frenet: boolean;
  database: boolean;
  webhook: boolean;
};
const moduleInfo: Record<string, [string, string]> = {
  Clientes: [
    "Uma visão de cada parceria",
    "Cadastro, contatos, histórico de pedidos e recompra.",
  ],
  Tráfego: [
    "Entenda como sua loja é encontrada",
    "Integração de analytics ainda não conectada.",
  ],
  Banners: [
    "Sua vitrine, sempre atualizada",
    "Gerencie campanhas da home e imagens por dispositivo.",
  ],
  Avaliações: [
    "A experiência de quem veste",
    "Modere avaliações vinculadas a compras verificadas.",
  ],
  Cupons: [
    "Um incentivo para novas parcerias",
    "Defina validade, mínimo de compra, limites e descontos.",
  ],
  Integrações: [
    "Conecte sua operação",
    "Neon, Blob, pagamentos, frete e comunicação.",
  ],
  Relatórios: [
    "Informação para decidir",
    "Vendas, produtos, clientes e produção em um só lugar.",
  ],
  Configurações: [
    "Cada detalhe da sua operação",
    "Dados da loja, regras de produção, equipe e permissões.",
  ],
  "Chat ao vivo": [
    "Conversas que aproximam",
    "Atendimento e histórico vinculados ao cliente.",
  ],
  Promoções: [
    "Prepare a próxima campanha",
    "Regras de preço por volume e campanhas sazonais.",
  ],
  Disparos: [
    "Sua marca presente",
    "Campanhas com consentimento e controle de destinatários.",
  ],
};
export default function AdminDashboard({
  orders: allOrders,
  source,
  error,
  integrations,
}: {
  orders: AdminOrder[];
  source: OrdersResult["source"];
  error?: string;
  integrations: Integrations;
}) {
  const rows = allOrders.map(toRow);
  const paid = allOrders.filter((o) => o.status === "pago");
  const now = new Date();
  const monthPaid = paid.filter((o) => {
    const d = new Date(o.createdAt);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const pending = allOrders.filter(
    (o) => o.status === "aguardando_pagamento" || o.status === "em_analise",
  );
  const lanes = [
    {
      label: "Aguardando pagamento",
      items: allOrders.filter((o) => o.status === "aguardando_pagamento"),
      color: "#edbe46",
    },
    {
      label: "Pagamento em análise",
      items: allOrders.filter((o) => o.status === "em_analise"),
      color: "#5698f4",
    },
    { label: "Pago · aguardando arte", items: paid, color: "#55b5a6" },
    {
      label: "Cancelado ou vencido",
      items: allOrders.filter((o) =>
        ["vencido", "recusado", "cancelado", "estornado"].includes(o.status),
      ),
      color: "#d9534f",
    },
  ];
  const chart = revenueChart(paid);
  const [active, setActive] = useState("Visão geral"),
    [collapsed, setCollapsed] = useState(false),
    [dark, setDark] = useState(false),
    [profile, setProfile] = useState(false),
    [notifications, setNotifications] = useState(false),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("Todos"),
    [detail, setDetail] = useState<Row | null>(null);
  const orders = rows.filter(
    (o) =>
      (o.company + " " + o.id).toLowerCase().includes(query.toLowerCase()) &&
      (filter === "Todos" || o.status === filter),
  );
  const orderTable = (
    <div className="admin-panel">
      <div className="panel-heading">
        <div>
          <h3>Últimos pedidos</h3>
          <p>Acompanhe cada etapa, da ideia à entrega.</p>
        </div>
        <button className="text-button" onClick={() => setActive("Pedidos")}>
          Ver todos <ArrowRight size={14} />
        </button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Pedido / cliente</th>
              <th>Produto</th>
              <th>Status</th>
              <th>Valor</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <div className="company-cell">
                    <span>{o.initial}</span>
                    <div>
                      <strong>{o.company}</strong>
                      <small>
                        #{o.id} · {o.date}
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  {o.product}
                  <small>{o.quantity} unidades</small>
                </td>
                <td>
                  <span className={"status " + o.tone}>{o.status}</span>
                </td>
                <td>
                  <strong>{money(o.total)}</strong>
                </td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={"Ver pedido " + o.id}
                    onClick={() => setDetail(o)}
                  >
                    <ArrowUpRight size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && (
          <p className="empty-state">Nenhum pedido corresponde aos filtros.</p>
        )}
      </div>
    </div>
  );
  return (
    <div
      className={
        "admin-app " + (dark ? "dark " : "") + (collapsed ? "collapsed" : "")
      }
    >
      <aside className="admin-sidebar">
        <Link href="/" className="brand">
          <span className="brand-symbol">e</span>
          {!collapsed && (
            <span>
              expressão<small>PAINEL DA FÁBRICA</small>
            </span>
          )}
        </Link>
        <span className="sidebar-label">PRINCIPAL</span>
        <nav>
          {navigation.map(([name, Icon], i) => (
            <button
              key={name}
              title={collapsed ? name : undefined}
              className={active === name ? "active" : ""}
              onClick={() => {
                setActive(name);
                setQuery("");
              }}
            >
              <Icon size={18} />
              {!collapsed && (
                <>
                  <span>{name}</span>
                  {name === "Pedidos" && pending.length > 0 && (
                    <b>{pending.length}</b>
                  )}
                </>
              )}
              {i === 9 && !collapsed && null}
            </button>
          ))}
        </nav>
        <Link href="/" className="visit-store">
          <ExternalLink size={17} />
          {!collapsed && "Ver minha loja"}
        </Link>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="button-row">
            <button
              className="icon-button"
              aria-label="Recolher ou expandir menu"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <PanelLeftOpen size={20} />
              ) : (
                <PanelLeftClose size={20} />
              )}
            </button>
            <span>
              Workspace <span className="muted">/</span>{" "}
              <strong>{active}</strong>
            </span>
          </div>
          <div className="admin-actions">
            <span className="demo-chip">
              {integrations.asaas === "production"
                ? "ASAAS · PRODUÇÃO"
                : integrations.asaas === "sandbox"
                  ? "ASAAS · SANDBOX"
                  : "SEM PAGAMENTOS"}
            </span>
            <button
              className="icon-button"
              aria-label="Alternar tema"
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="icon-button"
              aria-label="Notificações"
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={18} />
            </button>
            <button
              className="profile-button"
              onClick={() => setProfile(!profile)}
              aria-expanded={profile}
            >
              <span>EU</span>
              <div>
                Expressão Uniformes<small>Administrador</small>
              </div>
              <ChevronDown size={13} />
            </button>
          </div>
          {profile && (
            <div className="admin-popover">
              <strong>Sessão administrativa</strong>
              <p>
                Você entrou com a senha do painel. A sessão expira em 12 horas.
              </p>
              <form action={logout}>
                <button className="text-button" type="submit">
                  Sair do painel
                </button>
              </form>
              <button
                className="text-button"
                onClick={() => {
                  setActive("Configurações");
                  setProfile(false);
                }}
              >
                Configurações da loja
              </button>
            </div>
          )}
          {notifications && (
            <div className="admin-popover notification-popover">
              <strong>Notificações</strong>
              <p>
                {pending.length
                  ? `${pending.length} pedido(s) aguardando pagamento.`
                  : "Nenhum pedido aguardando pagamento."}
              </p>
              <button
                className="text-button"
                onClick={() => setNotifications(false)}
              >
                Entendi
              </button>
            </div>
          )}
        </header>
        <main className="admin-content">
          <div className="admin-page-heading">
            <div>
              <span className="eyebrow">SEU NEGÓCIO EM MOVIMENTO</span>
              <h1>
                {active === "Visão geral"
                  ? "Bom dia, equipe Expressão."
                  : active}
              </h1>
              <p>
                {active === "Visão geral"
                  ? "Vamos dar forma a novas ideias hoje?"
                  : "Gerencie cada detalhe da sua operação."}
              </p>
            </div>
            <Link href="/loja" className="button secondary small">
              Visitar loja <ArrowUpRight size={16} />
            </Link>
          </div>
          {(error || source !== "db") && (
            <div className="demo-notice">
              {error
                ? error
                : source === "asaas"
                  ? "Pedidos lidos direto do Asaas. Conecte o banco (Neon) para guardar endereço, tamanhos e logos de cada pedido."
                  : "Pagamentos não configurados: nenhum pedido real para exibir."}
            </div>
          )}
          {active === "Visão geral" ? (
            <>
              <div className="metric-grid">
                {[
                  [
                    "Receita paga no mês",
                    money(monthPaid.reduce((a, o) => a + o.total, 0)),
                    String(monthPaid.length),
                    "pedidos pagos no mês",
                    ShoppingBag,
                  ],
                  [
                    "Pedidos recebidos",
                    String(allOrders.length),
                    "",
                    "últimos 100 no Asaas",
                    Package,
                  ],
                  [
                    "Aguardando pagamento",
                    String(pending.length),
                    "",
                    money(pending.reduce((a, o) => a + o.total, 0)) +
                      " em aberto",
                    Clock,
                  ],
                  [
                    "Pagos · aguardando arte",
                    String(paid.length),
                    "",
                    "prontos para enviar o layout",
                    Palette,
                  ],
                ].map(([label, value, change, note, Icon]) => {
                  const I = Icon as typeof ShoppingBag;
                  return (
                    <div className="metric-card" key={String(label)}>
                      <div>
                        <span>{String(label)}</span>
                        <I size={18} />
                      </div>
                      <strong>{String(value)}</strong>
                      <p>
                        <b>{String(change)}</b> {String(note)}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="admin-chart-row">
                <section className="admin-panel sales-chart">
                  <div className="panel-heading">
                    <div>
                      <h3>Uma visão das suas vendas</h3>
                      <p>Receita paga · últimos 30 dias</p>
                    </div>
                    <span className="chart-legend">Receita</span>
                  </div>
                  <div className="chart-area">
                    <div className="chart-labels">
                      {[1, 0.75, 0.5, 0.25].map((f) => (
                        <span key={f}>
                          {money(chart.max * f).replace(",00", "")}
                        </span>
                      ))}
                    </div>
                    <div className="chart-plot">
                      <svg
                        viewBox="0 0 600 180"
                        preserveAspectRatio="none"
                        role="img"
                        aria-label="Receita paga por dia nos últimos 30 dias"
                      >
                        <defs>
                          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="0%"
                              stopColor="#2b70df"
                              stopOpacity=".2"
                            />
                            <stop
                              offset="100%"
                              stopColor="#2b70df"
                              stopOpacity="0"
                            />
                          </linearGradient>
                        </defs>
                        <path
                          d={`${chart.line} L600 180 L0 180Z`}
                          fill="url(#fill)"
                        />
                        <path
                          d={chart.line}
                          fill="none"
                          stroke="#2b70df"
                          strokeWidth="3"
                        />
                      </svg>
                      <div className="chart-dates">
                        {chart.labels.map((d) => (
                          <span key={d}>{d}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
                <section className="admin-panel production-card">
                  <div className="panel-heading">
                    <div>
                      <h3>Situação dos pedidos</h3>
                      <p>Do pagamento ao layout.</p>
                    </div>
                  </div>
                  {lanes.map(({ label, items, color }) => (
                    <div className="production-stat" key={label}>
                      <div>
                        <span>{label}</span>
                        <strong>{items.length}</strong>
                      </div>
                      <div className="progress-track">
                        <span
                          style={{
                            width:
                              (allOrders.length
                                ? (items.length / allOrders.length) * 100
                                : 0) + "%",
                            background: color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    className="text-button"
                    onClick={() => setActive("Produção")}
                  >
                    Acompanhar produção <ArrowRight size={15} />
                  </button>
                </section>
              </div>
              {orderTable}
            </>
          ) : active === "Pedidos" ? (
            <>
              <div className="catalog-toolbar admin-filter">
                <div className="search">
                  <Search size={17} />
                  <input
                    aria-label="Buscar pedidos"
                    placeholder="Buscar pedido ou cliente"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <select
                  aria-label="Filtrar status"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {["Todos", ...Object.values(statusInfo).map(([l]) => l)].map(
                    (s) => (
                      <option key={s}>{s}</option>
                    ),
                  )}
                </select>
              </div>
              {orderTable}
            </>
          ) : active === "Produtos" || active === "Personalizações" ? (
            <div className="admin-panel">
              <div className="panel-heading">
                <div>
                  <h3>
                    {active === "Produtos"
                      ? "Catálogo demonstrativo"
                      : "Modelos do estúdio"}
                  </h3>
                  <p>
                    O mesmo editor atende a criação do cliente e a revisão
                    interna.
                  </p>
                </div>
              </div>
              <div className="admin-product-list">
                {products.map((p) => (
                  <div key={p.slug}>
                    <span
                      className="product-color"
                      style={{ background: getColor(p.colors[0])?.hex }}
                    >
                      <Shirt size={24} />
                    </span>
                    <div>
                      <strong>{p.name}</strong>
                      <small>
                        {p.category} ·{" "}
                        {p.kind === "stock"
                          ? money(p.price) + " / un."
                          : "Orçamento"}
                      </small>
                    </div>
                    <a
                      className="button secondary small"
                      href={"/produto/" + p.slug}
                    >
                      <Palette size={15} /> Ver na loja
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : active === "Produção" ? (
            <div className="kanban">
              {lanes.map(({ label, items }) => (
                <section key={label}>
                  <h3>{label}</h3>
                  {items.map((o) => {
                    const r = toRow(o);
                    return (
                      <button key={o.id} onClick={() => setDetail(r)}>
                        <small>#{o.id}</small>
                        <strong>{r.company}</strong>
                        <span>
                          {r.quantity} peças · {r.product}
                        </span>
                        <span className={"status " + r.tone}>
                          {money(o.total)}
                        </span>
                      </button>
                    );
                  })}
                </section>
              ))}
            </div>
          ) : (
            <section className="admin-panel module-preview">
              <span className="module-icon">
                {(() => {
                  const I =
                    navigation.find(([n]) => n === active)?.[1] || Settings;
                  return <I size={30} />;
                })()}
              </span>
              <span className="eyebrow">MÓDULO PLANEJADO</span>
              <h2>{moduleInfo[active]?.[0]}</h2>
              <p>{moduleInfo[active]?.[1]}</p>
              {active === "Integrações" ? (
                <div className="integration-list">
                  {(
                    [
                      [
                        "Pagamentos · Asaas",
                        integrations.asaas === "production"
                          ? "Ativo · produção"
                          : integrations.asaas === "sandbox"
                            ? "Ativo · sandbox"
                            : "A configurar",
                      ],
                      [
                        "Webhook do Asaas",
                        integrations.webhook
                          ? "Token definido · cadastrar URL no Asaas"
                          : "A configurar",
                      ],
                      [
                        "Frete · Frenet",
                        integrations.frenet ? "Ativo" : "A configurar",
                      ],
                      [
                        "Banco de pedidos · Neon",
                        integrations.database ? "Ativo" : "A configurar",
                      ],
                      ["E-mail transacional", "A configurar"],
                    ] as const
                  ).map(([n, st]) => (
                    <div key={n}>
                      <strong>{n}</strong>
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="module-note">
                  Este módulo faz parte do escopo documentado. Sua implementação
                  depende da base de dados, das permissões e das regras
                  operacionais.
                </p>
              )}
            </section>
          )}
        </main>
      </div>
      {detail && (
        <div className="order-drawer-overlay" onClick={() => setDetail(null)}>
          <aside
            className="order-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={"Detalhes do pedido " + detail.id}
          >
            <div className="row-between">
              <span className="eyebrow">PEDIDO DA LOJA</span>
              <button
                className="icon-button"
                aria-label="Fechar detalhes"
                onClick={() => setDetail(null)}
              >
                <X />
              </button>
            </div>
            <h2>#{detail.id}</h2>
            <p>
              <strong>{detail.company}</strong>
              {detail.order.customer.email && (
                <>
                  <br />
                  {detail.order.customer.email}
                </>
              )}
              {detail.order.customer.phone && (
                <>
                  <br />
                  {detail.order.customer.phone}
                </>
              )}
              {detail.order.customer.document && (
                <>
                  <br />
                  CPF/CNPJ {detail.order.customer.document}
                </>
              )}
            </p>
            <span className={"status " + detail.tone}>{detail.status}</span>
            <hr />
            <h3>Itens</h3>
            {detail.order.items.length ? (
              <ul className="drawer-items">
                {detail.order.items.map((i, k) => (
                  <li key={k}>
                    {i.qty}x {i.name}
                    {i.color ? ` · ${i.color}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{detail.order.summary}</p>
            )}
            <p>
              {detail.quantity} peças ·{" "}
              {detail.order.method ? methodName[detail.order.method] : "—"} ·{" "}
              {detail.date}
            </p>
            {detail.order.shipping && <p>Entrega: {detail.order.shipping}</p>}
            {detail.order.address && <p>{detail.order.address}</p>}
            <strong>{money(detail.total)}</strong>
            <hr />
            <div className="button-row">
              {detail.order.invoiceUrl && (
                <a
                  className="button primary"
                  href={detail.order.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver fatura <ExternalLink size={15} />
                </a>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
