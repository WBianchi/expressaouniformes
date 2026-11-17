-- Configurações gerais da loja editadas no painel (uma linha por chave).
-- customization_fees: preços da personalização do simulador (técnica → posição → R$ por peça).
CREATE TABLE IF NOT EXISTS expressao.site_settings (
  key text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
