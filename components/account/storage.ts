// Armazenamento local da área do cliente (demonstração até integrar autenticação e backend).
// Contratos:
//   eu-profile → Profile
//   eu-orders  → Order[] (gravado pelo checkout)
//   eu-addresses → SavedAddress[]

export const PROFILE_KEY = "eu-profile";
export const ORDERS_KEY = "eu-orders";
export const ADDRESSES_KEY = "eu-addresses";
/** Evento disparado na janela quando o perfil muda (para header/menus reagirem). */
export const PROFILE_EVENT = "eu-profile-change";

export type Profile = {
  name: string;
  email: string;
  type: "pf" | "pj";
  phone?: string;
  company?: string;
  createdAt: string;
  /** sempre true enquanto não houver autenticação real */
  demo: true;
};

export type LayoutStatus = "aguardando" | "enviado" | "aprovado" | "ajuste";

export type Order = {
  id: string;
  createdAt: string;
  status: string;
  total: number;
  items: { slug: string; name: string; qty: number; color: string }[];
  payment?: { method: string; status: string; invoiceUrl?: string };
  layout?: { status: LayoutStatus; imageUrl?: string; comments?: string[] };
  /** marcado apenas no pedido ilustrativo exibido quando não há pedidos */
  sample?: boolean;
};

export type SavedAddress = {
  id: string;
  label: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readProfile(): Profile | null {
  const p = read<Partial<Profile> | null>(PROFILE_KEY, null);
  if (!p || typeof p.email !== "string" || typeof p.name !== "string") return null;
  return { type: "pf", createdAt: new Date().toISOString(), ...p, demo: true } as Profile;
}
export function saveProfile(p: Profile) {
  const ok = write(PROFILE_KEY, p);
  window.dispatchEvent(new Event(PROFILE_EVENT));
  return ok;
}
export function clearProfile() {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignora */
  }
  window.dispatchEvent(new Event(PROFILE_EVENT));
}

export function readOrders(): Order[] {
  const list = read<unknown>(ORDERS_KEY, []);
  if (!Array.isArray(list)) return [];
  return list.filter(
    (o): o is Order => !!o && typeof o === "object" && typeof (o as Order).id === "string" && Array.isArray((o as Order).items),
  );
}
export function saveOrders(orders: Order[]) {
  return write(
    ORDERS_KEY,
    orders.filter((o) => !o.sample),
  );
}

export const readAddresses = () => {
  const a = read<unknown>(ADDRESSES_KEY, []);
  return Array.isArray(a) ? (a as SavedAddress[]) : [];
};
export const saveAddresses = (a: SavedAddress[]) => write(ADDRESSES_KEY, a);

/** Pedido ilustrativo, exibido somente quando o navegador ainda não tem pedidos. */
export function sampleOrder(): Order {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  return {
    id: "EXEMPLO-0001",
    createdAt: d.toISOString(),
    status: "pago",
    total: 1089.6,
    items: [
      { slug: "polo-piquet-basica", name: "Polo Piquet Básica", qty: 20, color: "marinho" },
      { slug: "camiseta-algodao-basica", name: "Camiseta Algodão Básica", qty: 10, color: "branco" },
    ],
    payment: { method: "pix", status: "pago" },
    layout: { status: "enviado", comments: [] },
    sample: true,
  };
}

// ---------- status ----------
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export const timelineSteps = ["Pago", "Layout enviado", "Layout aprovado", "Produção", "Enviado"] as const;

const PAID = ["pago", "paid", "received", "confirmed", "confirmado", "aprovado", "recebido"];

export function isPaid(o: Order) {
  const st = norm(o.payment?.status ?? "");
  return PAID.some((p) => st.includes(p)) || stageFromStatus(o.status) >= 0;
}

function stageFromStatus(status: string) {
  const s = norm(status);
  if (/(entreg|transporte|despach|shipped|^enviado)/.test(s)) return 4;
  if (/(produc|production)/.test(s)) return 3;
  if (/layout.?aprov/.test(s)) return 2;
  if (/layout/.test(s)) return 1;
  if (PAID.some((p) => s.includes(p))) return 0;
  return -1;
}

/** Índice da última etapa concluída da timeline (-1 = aguardando pagamento). */
export function orderStage(o: Order) {
  let stage = stageFromStatus(o.status);
  if (stage < 0 && PAID.some((p) => norm(o.payment?.status ?? "").includes(p))) stage = 0;
  const l = o.layout?.status;
  if (l === "aprovado") stage = Math.max(stage, 2);
  else if ((l === "enviado" || l === "ajuste") && stage >= 0) stage = Math.max(stage, 1);
  return stage;
}

export function orderStatusLabel(o: Order) {
  const stage = orderStage(o);
  if (o.layout?.status === "ajuste" && stage < 3) return { label: "Ajuste de layout solicitado", tone: "gold" as const };
  if (stage < 0) return { label: "Aguardando pagamento", tone: "gold" as const };
  if (stage === 1) return { label: "Aguardando sua aprovação", tone: "brand" as const };
  return { label: timelineSteps[stage], tone: stage >= 2 ? ("success" as const) : ("brand" as const) };
}

export const paymentLabel = (m?: string) => {
  const s = norm(m ?? "");
  if (s.includes("pix")) return "Pix";
  if (s.includes("bole")) return "Boleto";
  if (s.includes("card") || s.includes("cart") || s.includes("credit")) return "Cartão de crédito";
  return m || "—";
};
