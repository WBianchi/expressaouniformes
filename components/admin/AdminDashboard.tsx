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
import { products, money } from "@/lib/catalog";
import { useStore } from "@/components/store/StoreProvider";
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
const demoOrders = [
  {
    id: "EXP-1028",
    company: "Horizonte Engenharia",
    initial: "HE",
    product: "Camiseta Operacional",
    quantity: 60,
    status: "Aguardando arte",
    total: 2694,
    date: "25 set, 10:42",
  },
  {
    id: "EXP-1027",
    company: "Clínica Bem Viver",
    initial: "BV",
    product: "Camiseta Bem-estar",
    quantity: 40,
    status: "Em produção",
    total: 1716,
    date: "25 set, 09:18",
  },
  {
    id: "EXP-1026",
    company: "Café do Centro",
    initial: "CC",
    product: "Camiseta Chef",
    quantity: 30,
    status: "Arte aprovada",
    total: 1377,
    date: "24 set, 16:35",
  },
  {
    id: "EXP-1025",
    company: "Norte Eventos",
    initial: "NE",
    product: "Camiseta Conecta",
    quantity: 100,
    status: "Enviado",
    total: 3690,
    date: "24 set, 14:06",
  },
];
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
export default function AdminDashboard() {
  const [active, setActive] = useState("Visão geral"),
    [collapsed, setCollapsed] = useState(false),
    [dark, setDark] = useState(false),
    [profile, setProfile] = useState(false),
    [notifications, setNotifications] = useState(false),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("Todos"),
    [detail, setDetail] = useState<(typeof demoOrders)[number] | null>(null);
  const { openStudio } = useStore();
  const orders = demoOrders.filter(
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
                  <span
                    className={
                      "status " +
                      (o.status === "Em produção"
                        ? "blue"
                        : o.status === "Aguardando arte"
                          ? "amber"
                          : "green")
                    }
                  >
                    {o.status}
                  </span>
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
                  {name === "Pedidos" && <b>4</b>}
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
            <span className="demo-chip">DEMONSTRAÇÃO</span>
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
                Expressão Uniformes<small>Administrador · prévia</small>
              </div>
              <ChevronDown size={13} />
            </button>
          </div>
          {profile && (
            <div className="admin-popover">
              <strong>Perfil demonstrativo</strong>
              <p>Nenhuma sessão administrativa real está ativa.</p>
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
                Sem notificações reais. A conexão com pedidos e produção está
                prevista no checklist.
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
          <div className="demo-notice">
            Dados fictícios para apresentação. Alterações comerciais e
            integrações ainda não estão habilitadas.
          </div>
          {active === "Visão geral" ? (
            <>
              <div className="metric-grid">
                {[
                  [
                    "Receita do período",
                    "R$ 28.470,00",
                    "+12,8%",
                    "vs. período anterior",
                    ShoppingBag,
                  ],
                  ["Pedidos recebidos", "24", "+6", "neste período", Package],
                  [
                    "Artes para revisar",
                    "08",
                    "",
                    "aguardando seu olhar",
                    Palette,
                  ],
                  [
                    "Em produção",
                    "12",
                    "",
                    "equipes prestes a vestir",
                    Factory,
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
                      <p>Evolução demonstrativa · setembro de 2026</p>
                    </div>
                    <span className="chart-legend">Receita</span>
                  </div>
                  <div className="chart-area">
                    <div className="chart-labels">
                      <span>R$ 10 mil</span>
                      <span>R$ 7,5 mil</span>
                      <span>R$ 5 mil</span>
                      <span>R$ 2,5 mil</span>
                    </div>
                    <div className="chart-plot">
                      <svg
                        viewBox="0 0 600 180"
                        preserveAspectRatio="none"
                        role="img"
                        aria-label="Gráfico demonstrativo de receita com tendência crescente"
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
                          d="M0 150 C30 160 35 100 70 115 S110 150 145 110 S170 135 200 85 S235 115 265 65 S300 95 330 72 S370 125 400 80 S430 90 460 42 S500 60 525 30 S565 70 600 12 L600 180 L0 180Z"
                          fill="url(#fill)"
                        />
                        <path
                          d="M0 150 C30 160 35 100 70 115 S110 150 145 110 S170 135 200 85 S235 115 265 65 S300 95 330 72 S370 125 400 80 S430 90 460 42 S500 60 525 30 S565 70 600 12"
                          fill="none"
                          stroke="#2b70df"
                          strokeWidth="3"
                        />
                      </svg>
                      <div className="chart-dates">
                        {[
                          "01 set",
                          "05 set",
                          "10 set",
                          "15 set",
                          "20 set",
                          "25 set",
                        ].map((d) => (
                          <span key={d}>{d}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
                <section className="admin-panel production-card">
                  <div className="panel-heading">
                    <div>
                      <h3>Na linha de produção</h3>
                      <p>Cada peça, uma etapa.</p>
                    </div>
                  </div>
                  {[
                    ["Aguardando aprovação", 8, "#edbe46"],
                    ["Arte aprovada", 4, "#5698f4"],
                    ["Em produção", 12, "#2964c5"],
                    ["Pronto para envio", 6, "#55b5a6"],
                  ].map(([label, n, color]) => (
                    <div className="production-stat" key={label}>
                      <div>
                        <span>{label}</span>
                        <strong>{n}</strong>
                      </div>
                      <div className="progress-track">
                        <span
                          style={{
                            width: Number(n) / 0.16 + "%",
                            background: String(color),
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
                  {[
                    "Todos",
                    "Aguardando arte",
                    "Arte aprovada",
                    "Em produção",
                    "Enviado",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
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
                  <div key={p.id}>
                    <span
                      className="product-color"
                      style={{ background: p.color }}
                    >
                      <Shirt size={24} />
                    </span>
                    <div>
                      <strong>{p.name}</strong>
                      <small>
                        {p.category} · {money(p.price)} / un.
                      </small>
                    </div>
                    <button
                      className="button secondary small"
                      onClick={() => openStudio(p)}
                    >
                      <Palette size={15} /> Abrir estúdio
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : active === "Produção" ? (
            <div className="kanban">
              {[
                "Aguardando arte",
                "Arte aprovada",
                "Em produção",
                "Enviado",
              ].map((status) => (
                <section key={status}>
                  <h3>{status}</h3>
                  {demoOrders
                    .filter((o) => o.status === status)
                    .map((o) => (
                      <button key={o.id} onClick={() => setDetail(o)}>
                        <small>#{o.id}</small>
                        <strong>{o.company}</strong>
                        <span>
                          {o.quantity} peças · {o.product}
                        </span>
                        <span className="status blue">{money(o.total)}</span>
                      </button>
                    ))}
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
                  {[
                    "Neon PostgreSQL",
                    "Vercel Blob",
                    "Gateway de pagamento",
                    "Cálculo de frete",
                    "E-mail transacional",
                  ].map((n) => (
                    <div key={n}>
                      <strong>{n}</strong>
                      <span>A configurar</span>
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
            aria-label="Detalhes do pedido demonstrativo"
          >
            <div className="row-between">
              <span className="eyebrow">PEDIDO DEMONSTRATIVO</span>
              <button
                className="icon-button"
                aria-label="Fechar detalhes"
                onClick={() => setDetail(null)}
              >
                <X />
              </button>
            </div>
            <h2>#{detail.id}</h2>
            <p>{detail.company}</p>
            <span className="status blue">{detail.status}</span>
            <hr />
            <h3>{detail.product}</h3>
            <p>{detail.quantity} unidades</p>
            <strong>{money(detail.total)}</strong>
            <hr />
            <p className="muted">
              Exemplo de acompanhamento. Nenhum pedido real foi criado. O
              arquivo da arte, a aprovação e os dados de entrega serão
              associados ao conectar a operação.
            </p>
            <button
              className="button primary"
              onClick={() => {
                const p = products.find((p) => p.name === detail.product);
                if (p) {
                  setDetail(null);
                  openStudio(p);
                }
              }}
            >
              Abrir modelo no estúdio
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
