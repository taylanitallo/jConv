-- Migration 0030: superadmin — quem administra os municípios, e o registro de acesso
--
-- Estas tabelas vivem no schema mestre, e não no de nenhum município: são exatamente o que
-- nenhuma prefeitura pode enxergar. Como em `clientes`, a RLS fica ligada e sem policy alguma —
-- só a conexão de service_role (a API, fora de sessão de município) lê e escreve aqui.

CREATE TABLE IF NOT EXISTS superadmins (
  usuario_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE superadmins ENABLE ROW LEVEL SECURITY;

-- Registro de acesso: uma linha por tentativa de entrar no sistema, com ou sem sucesso.
-- É o que responde "quem entrou, de onde e em qual município" — e, pelas falhas, "quem tentou".
CREATE TABLE IF NOT EXISTS acessos (
  id            UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  email         TEXT NOT NULL,
  usuario_id    UUID,
  cliente_slug  TEXT,
  sucesso       BOOLEAN NOT NULL,
  motivo        TEXT,
  ip            TEXT,
  agente        TEXT,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE acessos ENABLE ROW LEVEL SECURITY;

-- Consulta típica do relatório: por período, e filtrando por município.
CREATE INDEX IF NOT EXISTS acessos_criado_em_idx ON acessos (criado_em DESC);
CREATE INDEX IF NOT EXISTS acessos_cliente_idx ON acessos (cliente_slug, criado_em DESC);

-- O dono do sistema entra como superadmin. Sem isso a tela nasce sem ninguém que possa abri-la,
-- e não há como se cadastrar por dentro dela.
INSERT INTO superadmins (usuario_id, nome, email)
SELECT u.id, 'Taylan Itallo', u.email
  FROM auth.users u
 WHERE u.email = 'taylan.itallo@gmail.com'
    ON CONFLICT (usuario_id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM superadmins) THEN
    RAISE EXCEPTION 'Nenhum superadmin cadastrado — a tela de gestão ficaria inacessível';
  END IF;
END $$;
