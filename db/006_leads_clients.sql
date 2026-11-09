-- Contatos do questionário de qualificação (recuperação de quem não finalizou)
-- e logos de empresas clientes exibidas na home (somente logos autorizadas).
CREATE TABLE IF NOT EXISTS expressao.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  product text NOT NULL,
  qty text NOT NULL,
  route text NOT NULL CHECK (route IN ('minimo','loja','fabrica')),
  custom boolean NOT NULL DEFAULT false,
  technique text NOT NULL DEFAULT '',
  fabric text[] NOT NULL DEFAULT '{}',
  source text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo','contatado','convertido','perdido')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leads_created_idx ON expressao.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx ON expressao.leads (status, created_at DESC);

CREATE TABLE IF NOT EXISTS expressao.client_logos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text NOT NULL,
  sort integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
