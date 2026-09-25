CREATE SCHEMA IF NOT EXISTS expressao;
CREATE TABLE IF NOT EXISTS expressao.ai_generation_limits (
  bucket text NOT NULL,
  day date NOT NULL,
  count integer NOT NULL CHECK (count > 0),
  PRIMARY KEY (bucket, day)
);
