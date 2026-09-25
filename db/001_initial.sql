-- Proposta de migração PostgreSQL. Não aplicada automaticamente.
-- Executar somente depois de revisar o banco e definir autenticação/pagamentos.
BEGIN;
CREATE SCHEMA IF NOT EXISTS expressao;
CREATE TABLE IF NOT EXISTS expressao.products (
 id text PRIMARY KEY, slug text NOT NULL UNIQUE, name text NOT NULL,
 description text NOT NULL DEFAULT '', category text NOT NULL,
 base_price_cents integer NOT NULL CHECK (base_price_cents >= 0),
 minimum_quantity integer NOT NULL DEFAULT 30 CHECK (minimum_quantity > 0),
 active boolean NOT NULL DEFAULT true, configuration jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS expressao.accounts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), auth_subject text NOT NULL UNIQUE,
 email text NOT NULL, name text NOT NULL, role text NOT NULL DEFAULT 'customer'
 CHECK (role IN ('customer','admin','production')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS accounts_email_unique ON expressao.accounts(lower(email));
CREATE TABLE IF NOT EXISTS expressao.assets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES expressao.accounts(id),
 blob_path text NOT NULL UNIQUE, mime_type text NOT NULL, size_bytes bigint NOT NULL CHECK(size_bytes>0),
 original_name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS expressao.designs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES expressao.accounts(id),
 product_id text NOT NULL REFERENCES expressao.products(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS expressao.design_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), design_id uuid NOT NULL REFERENCES expressao.designs(id),
 version integer NOT NULL CHECK(version>0), document jsonb NOT NULL,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','changes_requested','approved')),
 author_id uuid NOT NULL REFERENCES expressao.accounts(id), approved_by uuid REFERENCES expressao.accounts(id),
 approved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(design_id,version)
);
CREATE TABLE IF NOT EXISTS expressao.orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_id uuid NOT NULL REFERENCES expressao.accounts(id),
 idempotency_key text NOT NULL UNIQUE,
 status text NOT NULL DEFAULT 'awaiting_review' CHECK(status IN ('awaiting_review','awaiting_payment','paid','production','shipped','cancelled')),
 subtotal_cents integer NOT NULL CHECK(subtotal_cents>=0), shipping_cents integer NOT NULL DEFAULT 0 CHECK(shipping_cents>=0),
 shipping_address jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS expressao.order_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES expressao.orders(id),
 product_id text NOT NULL REFERENCES expressao.products(id), design_version_id uuid NOT NULL REFERENCES expressao.design_versions(id),
 product_snapshot jsonb NOT NULL, design_snapshot jsonb NOT NULL, sizes jsonb NOT NULL,
 quantity integer NOT NULL CHECK(quantity>0), unit_price_cents integer NOT NULL CHECK(unit_price_cents>=0)
);
CREATE INDEX IF NOT EXISTS designs_owner_idx ON expressao.designs(owner_id);
CREATE INDEX IF NOT EXISTS orders_account_idx ON expressao.orders(account_id,created_at DESC);
COMMIT;
