-- Habilitar a extensão UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Mídias (Imagens ou Vídeos das ofertas)
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_type VARCHAR(50) CHECK (media_type IN ('image', 'video')),
  url TEXT NOT NULL,
  duration INT DEFAULT 10,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar o Realtime para a tabela de mídias (Crucial para atualização da TV)
BEGIN;
  -- Remove a publicação se existir para recriar (evita erros)
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE media;

-- Desativar RLS para fins de demonstração (Ou você pode configurar as policies no painel)
ALTER TABLE media DISABLE ROW LEVEL SECURITY;
