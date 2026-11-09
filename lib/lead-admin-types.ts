// Tipos dos contatos (leads) usados no painel.
export const LEAD_STATUSES = ["novo", "contatado", "convertido", "perdido"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type AdminLead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  product: string;
  qty: string;
  route: "minimo" | "loja" | "fabrica";
  custom: boolean;
  technique: string;
  fabric: string[];
  source: string;
  status: LeadStatus;
  createdAt: string;
};
