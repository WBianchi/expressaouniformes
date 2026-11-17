-- Categorias renomeadas ou criadas pelo painel. Sem linha = categoria como está no código.
-- created = categoria nova (não existe no código). O slug nunca muda: os produtos continuam ligados.
CREATE TABLE IF NOT EXISTS expressao.category_edits (
  slug text PRIMARY KEY,
  name text,
  description text,
  icon text,
  created boolean NOT NULL DEFAULT false,
  sort integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Anúncios cadastrados pelo painel (produtos que não existem no código). Aqui só os dados de
-- partida; título, descrição, preço, fotos etc. ficam em product_listings, como nos outros anúncios.
CREATE TABLE IF NOT EXISTS expressao.created_products (
  slug text PRIMARY KEY,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('stock', 'custom')),
  category text NOT NULL,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
