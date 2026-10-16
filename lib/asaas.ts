// Cliente server-only da API v3 do Asaas (https://docs.asaas.com).
// - Autenticação pelo header `access_token` (não usa Bearer) + `User-Agent` obrigatório.
// - Produção: https://api.asaas.com/v3 · Sandbox: https://api-sandbox.asaas.com/v3
// Nunca registra em log o corpo das requisições (contém dados pessoais e, no cartão, dados do cartão).
import "server-only";

export type AsaasEnv = "sandbox" | "production";

const BASE: Record<AsaasEnv, string> = {
  production: "https://api.asaas.com/v3",
  sandbox: "https://api-sandbox.asaas.com/v3",
};

export function asaasConfig(): { key: string; env: AsaasEnv; baseUrl: string } | null {
  const key = process.env.ASAAS_API_KEY?.trim();
  if (!key) return null;
  const env: AsaasEnv = process.env.ASAAS_ENV === "production" ? "production" : "sandbox";
  return { key, env, baseUrl: BASE[env] };
}

export const asaasMode = (): AsaasEnv | "demo" => asaasConfig()?.env ?? "demo";

export class AsaasError extends Error {
  status: number;
  code?: string;
  /** mensagens retornadas pelo Asaas em errors[].description (em português, seguras para o usuário) */
  descriptions: string[];
  constructor(status: number, descriptions: string[], code?: string) {
    super(descriptions[0] || `Erro ${status} no Asaas`);
    this.name = "AsaasError";
    this.status = status;
    this.code = code;
    this.descriptions = descriptions;
  }
  /** Mensagem para exibir ao cliente: detalha erros de validação (400), genérica no resto. */
  get publicMessage() {
    if (this.status === 400 && this.descriptions.length) return this.descriptions.join(" ");
    if (this.status === 0) return "O provedor de pagamento não respondeu a tempo. Tente novamente.";
    return "Não foi possível processar o pagamento agora. Tente novamente em instantes.";
  }
}

async function request<T>(path: string, init: { method?: "GET" | "POST"; body?: unknown; timeoutMs?: number } = {}): Promise<T> {
  const cfg = asaasConfig();
  if (!cfg) throw new AsaasError(503, ["Pagamentos não configurados."], "not_configured");
  let res: Response;
  try {
    res = await fetch(`${cfg.baseUrl}${path}`, {
      method: init.method ?? "GET",
      headers: {
        access_token: cfg.key,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": `ExpressaoUniformes/1.0 (Next.js; ${cfg.env})`,
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(init.timeoutMs ?? 15_000),
      cache: "no-store",
    });
  } catch {
    throw new AsaasError(0, [], "network");
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* resposta não-JSON */
  }
  if (!res.ok) {
    const errors = (data as { errors?: { code?: string; description?: string }[] } | null)?.errors ?? [];
    throw new AsaasError(
      res.status,
      errors.map((e) => e.description).filter((d): d is string => !!d),
      errors[0]?.code,
    );
  }
  return data as T;
}

// ---------------------------------------------------------------- tipos

export type AsaasCustomerInput = {
  name: string;
  cpfCnpj: string;
  email: string;
  mobilePhone?: string;
  phone?: string;
  company?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  externalReference?: string;
};

export type AsaasBillingType = "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED";

export type AsaasPaymentInput = {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  dueDate: string; // AAAA-MM-DD
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  totalValue?: number;
  installmentValue?: number;
  creditCard?: { holderName: string; number: string; expiryMonth: string; expiryYear: string; ccv: string };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
    phone: string;
    mobilePhone?: string;
  };
  remoteIp?: string;
  callback?: { successUrl: string; autoRedirect?: boolean };
};

export type AsaasPayment = {
  id: string;
  status: string;
  value: number;
  netValue?: number;
  billingType: AsaasBillingType;
  dueDate: string;
  invoiceUrl?: string;
  bankSlipUrl?: string | null;
  externalReference?: string | null;
  installment?: string | null;
};

export type AsaasPixQrCode = { encodedImage: string; payload: string; expirationDate?: string; description?: string };
export type AsaasBoletoLine = { identificationField: string; nossoNumero?: string; barCode?: string };

// ---------------------------------------------------------------- operações

/** Busca cliente pelo CPF/CNPJ; cria se não existir. Retorna o id (cus_...). */
export async function createOrFindCustomer(input: AsaasCustomerInput): Promise<string> {
  const cpfCnpj = input.cpfCnpj.replace(/\D/g, "");
  const found = await request<{ data: { id: string; deleted?: boolean }[] }>(
    `/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}&limit=1`,
  );
  const existing = found.data?.find((c) => !c.deleted);
  if (existing) return existing.id;
  const created = await request<{ id: string }>("/customers", {
    method: "POST",
    body: { ...input, cpfCnpj, notificationDisabled: false },
  });
  return created.id;
}

export function createPayment(input: AsaasPaymentInput) {
  // cartão é processado de forma síncrona pelo Asaas: dá mais tempo à resposta
  return request<AsaasPayment>("/payments", {
    method: "POST",
    body: input,
    timeoutMs: input.billingType === "CREDIT_CARD" ? 45_000 : 20_000,
  });
}

export const getPayment = (id: string) => request<AsaasPayment>(`/payments/${encodeURIComponent(id)}`);

export const getPixQrCode = (paymentId: string) =>
  request<AsaasPixQrCode>(`/payments/${encodeURIComponent(paymentId)}/pixQrCode`);

export const getBoletoLine = (paymentId: string) =>
  request<AsaasBoletoLine>(`/payments/${encodeURIComponent(paymentId)}/identificationField`);

/** Data (AAAA-MM-DD) no fuso de São Paulo, somando dias. */
export function dueDateFromToday(days: number, now = new Date()) {
  const d = new Date(now.getTime() + days * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
}

// ---------------------------------------------------------------- consultas (painel e acompanhamento)

export type AsaasPaymentListItem = AsaasPayment & {
  customer: string;
  dateCreated: string;
  description?: string | null;
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
};

export type AsaasCustomer = { id: string; name: string; email?: string | null; mobilePhone?: string | null; phone?: string | null; cpfCnpj?: string | null; company?: string | null };

export const listPayments = (params: { limit?: number; offset?: number; externalReference?: string } = {}) => {
  const q = new URLSearchParams({ limit: String(params.limit ?? 100), offset: String(params.offset ?? 0) });
  if (params.externalReference) q.set("externalReference", params.externalReference);
  return request<{ data: AsaasPaymentListItem[]; totalCount?: number; hasMore?: boolean }>(`/payments?${q}`);
};

export const getCustomer = (id: string) => request<AsaasCustomer>(`/customers/${encodeURIComponent(id)}`);
