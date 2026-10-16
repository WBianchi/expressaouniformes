-- Conteúdo editável pelo painel: banners da home e fotos de vitrine dos produtos.
-- Imagens enviadas pelo painel ficam no Vercel Blob; aqui só a URL.
BEGIN;
CREATE SCHEMA IF NOT EXISTS expressao;

CREATE TABLE IF NOT EXISTS expressao.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  cta_label text NOT NULL DEFAULT '',
  cta_href text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  sort integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS banners_sort_idx ON expressao.banners (sort, created_at);

-- slot 0 = foto principal (estúdio), slot 1 = segunda foto (ambiente de trabalho)
CREATE TABLE IF NOT EXISTS expressao.product_photos (
  slug text NOT NULL,
  slot smallint NOT NULL CHECK (slot IN (0, 1)),
  url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (slug, slot)
);

-- banners iniciais (só se a tabela estiver vazia)
INSERT INTO expressao.banners (title, subtitle, cta_label, cta_href, image_url, sort)
SELECT * FROM (VALUES
  ('Uniformes com a logo da sua empresa', 'Compre online a partir de 5 peças. Fábrica própria e entrega para todo o Brasil.', 'Comprar pronta-entrega', '/loja?tipo=stock', '/images/products/polo-pv-basica-modelo-2.webp', 1),
  ('Monte o pedido da sua empresa', 'Vários modelos, cores e quantidades em um só orçamento, a partir de 30 peças.', 'Montar meu pedido', '/orcamento', '/images/products/camisa-operacional-brim-modelo-2.webp', 2),
  ('Veja a sua logo na peça antes de comprar', 'Envie a logo, escolha onde aplicar e aprove o layout antes da produção.', 'Personalizar agora', '/loja', '/images/products/dolma-chef-modelo-2.webp', 3),
  ('Saúde, estética e atendimento', 'Jalecos e polos que valorizam a sua equipe todos os dias.', 'Ver jalecos', '/loja?categoria=jalecos', '/images/products/jaleco-gabardine-modelo-2.webp', 4)
) AS v(title, subtitle, cta_label, cta_href, image_url, sort)
WHERE NOT EXISTS (SELECT 1 FROM expressao.banners);
COMMIT;
