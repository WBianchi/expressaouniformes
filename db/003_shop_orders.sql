-- Pedidos da loja pronta-entrega (checkout com Asaas) e eventos de webhook processados.
-- Aplicar manualmente no Neon: psql "$DATABASE_URL" -f db/003_shop_orders.sql
BEGIN;
CREATE SCHEMA IF NOT EXISTS expressao;

CREATE TABLE IF NOT EXISTS expressao.shop_orders (
  id text PRIMARY KEY,                       -- EU-AAMMDD-XXXXX (também usado como externalReference no Asaas)
  idempotency_key text NOT NULL UNIQUE,      -- gerado no navegador a cada tentativa de finalizar
  status text NOT NULL DEFAULT 'aguardando_pagamento'
    CHECK (status IN ('aguardando_pagamento','pago','em_analise','vencido','recusado','cancelado','estornado')),
  payment_method text NOT NULL CHECK (payment_method IN ('pix','boleto','cartao')),
  payment_status text NOT NULL DEFAULT 'pendente',
  asaas_payment_id text UNIQUE,
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  customer_email text NOT NULL,
  data jsonb NOT NULL,                       -- cliente, endereço, itens recalculados, pagamento (nunca dados de cartão)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shop_orders_email_idx ON expressao.shop_orders (customer_email, created_at DESC);
CREATE INDEX IF NOT EXISTS shop_orders_status_idx ON expressao.shop_orders (status, created_at DESC);

CREATE TABLE IF NOT EXISTS expressao.asaas_webhook_events (
  id text PRIMARY KEY,                       -- id do evento enviado pelo Asaas (evt_...)
  event text NOT NULL,
  payment_id text,
  received_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
