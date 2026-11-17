-- Anúncios editados pelo painel (título, descrição, ficha técnica, preço, cores, tamanhos, fotos por cor).
-- data guarda só os campos alterados; o resto continua vindo do catálogo do código (lib/catalog.ts).
-- Sem linha = anúncio como está no código.
CREATE TABLE IF NOT EXISTS expressao.product_listings (
  slug text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
