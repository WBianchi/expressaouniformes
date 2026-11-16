-- Fotos da peça sozinha também trocáveis pelo painel:
-- slot 0–1 = pessoa vestindo (vitrine), 2 = peça de frente, 3 = costas, 4 = lado
-- (simulador da logo e troca de cor; a máscara peça × fundo é calculada no navegador).
ALTER TABLE expressao.product_photos DROP CONSTRAINT IF EXISTS product_photos_slot_check;
ALTER TABLE expressao.product_photos ADD CONSTRAINT product_photos_slot_check CHECK (slot BETWEEN 0 AND 4);
