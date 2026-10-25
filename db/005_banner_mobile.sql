-- Banner com imagem própria para celular (vertical). Vazio = usa a de desktop.
ALTER TABLE expressao.banners ADD COLUMN IF NOT EXISTS image_mobile_url text NOT NULL DEFAULT '';
