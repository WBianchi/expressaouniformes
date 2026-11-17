-- Revisão da arte (logo) de cada pedido, feita no painel → Personalizações.
-- Sem linha = aguardando revisão. "ajuste": a fábrica pediu outra arte ao cliente (note = o que ajustar).
CREATE TABLE IF NOT EXISTS expressao.art_reviews (
  order_id text PRIMARY KEY REFERENCES expressao.shop_orders (id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('revisao', 'ajuste', 'aprovada')),
  note text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
