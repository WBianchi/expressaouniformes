-- Foto de cada categoria (home e menu), trocável pelo painel. Sem linha = imagem padrão do catálogo.
-- show_name: mostra o nome da categoria sobre a foto (as imagens padrão já trazem o nome escrito).
CREATE TABLE IF NOT EXISTS expressao.category_photos (
  slug text PRIMARY KEY,
  url text NOT NULL,
  show_name boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
