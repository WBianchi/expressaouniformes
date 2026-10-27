// Leitura de pedidos para o painel e para o acompanhamento do cliente (server-only).
// Com DATABASE_URL lê o banco (itens completos); sem banco usa as cobranças do Asaas como fonte.
import "server-only";
import {
  asaasConfig,
  getCustomer,
  listPayments,
  type AsaasPaymentListItem,
} from "./asaas";
import {
  ORDER_ID_RE,
  hasDatabase,
  orderStatusFromPayment,
  parseDescription,
  paymentStatusFromAsaas,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
  type QuoteLine,
  type ShopOrderRecord,
} from "./orders";

export type AdminOrder = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  method: PaymentMethod | null;
  total: number;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    document?: string;
    company?: string;
  };
  /** itens detalhados (com banco) ou resumo da descrição da cobrança (sem banco) */
  items: {
    name: string;
    qty: number;
    color?: string;
    /** só pedidos do banco: dados para a prévia da logo no painel */
    slug?: string;
    positions?: QuoteLine["positions"];
    logos?: QuoteLine["logos"];
    placements?: QuoteLine["placements"];
  }[];
  summary: string;
  shipping?: string;
  address?: string;
  invoiceUrl?: string;
  asaasPaymentId?: string;
  source: "db" | "asaas";
};

export type OrdersResult = {
  orders: AdminOrder[];
  source: "db" | "asaas" | "none";
  error?: string;
};

const methodFromBilling = (b?: string): PaymentMethod | null =>
  b === "PIX"
    ? "pix"
    : b === "BOLETO"
      ? "boleto"
      : b === "CREDIT_CARD"
        ? "cartao"
        : null;

/** "AAAA-MM-DD" ou "AAAA-MM-DD HH:mm:ss" (Brasília) → ISO */
const asaasDate = (v?: string | null) =>
  v
    ? v.length === 10
      ? `${v}T12:00:00-03:00`
      : `${v.replace(" ", "T")}-03:00`
    : new Date().toISOString();

async function sql() {
  const { neon } = await import("@neondatabase/serverless");
  return neon(process.env.DATABASE_URL!);
}

function fromRecord(r: ShopOrderRecord): AdminOrder {
  const a = r.address;
  return {
    id: r.id,
    createdAt: r.createdAt,
    status: r.status,
    paymentStatus: r.payment.status,
    method: r.payment.method,
    total: r.quote.chargeTotal,
    customer: {
      name: r.customer.company || r.customer.name,
      email: r.customer.email,
      phone: r.customer.phone,
      document: r.customer.document,
      company: r.customer.company,
    },
    items: r.quote.lines.map((l) => ({
      name: l.name,
      qty: l.qty,
      color: l.colorName,
      slug: l.slug,
      positions: l.positions,
      logos: l.logos,
      placements: l.placements,
    })),
    summary: r.quote.lines.map((l) => `${l.qty}x ${l.name}`).join(", "),
    shipping: r.quote.shipping.label,
    address: a
      ? `${a.street}, ${a.number}${a.complement ? ` - ${a.complement}` : ""} · ${a.district} · ${a.city}/${a.state} · ${a.cep}`
      : undefined,
    invoiceUrl: r.payment.invoiceUrl,
    asaasPaymentId: r.payment.id ?? undefined,
    source: "db",
  };
}

function fromPayment(
  p: AsaasPaymentListItem,
  customers: Map<string, Awaited<ReturnType<typeof getCustomer>> | null>,
): AdminOrder {
  const c = customers.get(p.customer);
  const paymentStatus = paymentStatusFromAsaas(p.status);
  const { items, shipping } = parseDescription(p.description);
  return {
    id: p.externalReference!,
    createdAt: asaasDate(p.dateCreated),
    status: orderStatusFromPayment(paymentStatus),
    paymentStatus,
    method: methodFromBilling(p.billingType),
    total: p.value,
    customer: {
      name: c?.company || c?.name || "Cliente",
      email: c?.email ?? undefined,
      phone: c?.mobilePhone || c?.phone || undefined,
      document: c?.cpfCnpj ?? undefined,
      company: c?.company ?? undefined,
    },
    items,
    summary: items.length
      ? items.map((i) => `${i.qty}x ${i.name}`).join(", ")
      : (p.description ?? ""),
    shipping,
    invoiceUrl: p.invoiceUrl,
    asaasPaymentId: p.id,
    source: "asaas",
  };
}

export async function listOrders(): Promise<OrdersResult> {
  if (hasDatabase()) {
    try {
      const db = await sql();
      const rows =
        await db`SELECT data FROM expressao.shop_orders ORDER BY created_at DESC LIMIT 300`;
      return {
        orders: rows.map((r) => fromRecord(r.data as ShopOrderRecord)),
        source: "db",
      };
    } catch {
      return {
        orders: [],
        source: "db",
        error: "Não foi possível ler o banco de pedidos.",
      };
    }
  }
  if (!asaasConfig()) return { orders: [], source: "none" };
  try {
    const { data } = await listPayments({ limit: 100 });
    // parcelas do cartão geram várias cobranças com o mesmo pedido: mantém uma por pedido
    const seen = new Set<string>();
    const shop = data.filter(
      (p) =>
        p.externalReference &&
        ORDER_ID_RE.test(p.externalReference) &&
        !seen.has(p.externalReference) &&
        seen.add(p.externalReference),
    );
    const ids = [...new Set(shop.map((p) => p.customer))].slice(0, 60);
    const customers = new Map(
      await Promise.all(
        ids.map(
          async (id) => [id, await getCustomer(id).catch(() => null)] as const,
        ),
      ),
    );
    return {
      orders: shop.map((p) => fromPayment(p, customers)),
      source: "asaas",
    };
  } catch {
    return {
      orders: [],
      source: "asaas",
      error: "Não foi possível consultar o Asaas agora.",
    };
  }
}

/** Status público de um pedido (sem dados pessoais) para a página do pedido e a área do cliente. */
export async function getOrderStatus(
  id: string,
): Promise<{
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  invoiceUrl?: string;
} | null> {
  if (!ORDER_ID_RE.test(id)) return null;
  if (hasDatabase()) {
    const db = await sql();
    const rows =
      await db`SELECT status, payment_status, data->'payment'->>'invoiceUrl' AS invoice FROM expressao.shop_orders WHERE id = ${id} LIMIT 1`;
    const r = rows[0] as
      | {
          status: OrderStatus;
          payment_status: PaymentStatus;
          invoice: string | null;
        }
      | undefined;
    if (r)
      return {
        status: r.status,
        paymentStatus: r.payment_status,
        invoiceUrl: r.invoice ?? undefined,
      };
  }
  if (!asaasConfig()) return null;
  const { data } = await listPayments({ externalReference: id, limit: 12 });
  if (!data.length) return null;
  // parcelado: pago quando a primeira parcela é confirmada
  const statuses = data.map((p) => paymentStatusFromAsaas(p.status));
  const paymentStatus = statuses.includes("pago") ? "pago" : statuses[0];
  return {
    status: orderStatusFromPayment(paymentStatus),
    paymentStatus,
    invoiceUrl: data[0].invoiceUrl,
  };
}
