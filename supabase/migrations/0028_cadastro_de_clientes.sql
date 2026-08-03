-- Migration 0028: cadastro de municípios (multi-tenant por schema)
--
-- O sistema passa a servir vários municípios, um schema Postgres por cliente, e o schema public
-- deixa de guardar dados de negócio para virar o "mestre": só o cadastro de clientes e o
-- controle de migrations.
--
-- Isolamento é físico: o dado de um município não é visível para outro nem por engano de
-- policy, porque sequer está no mesmo schema. Esta migration só ADICIONA o cadastro — as
-- tabelas de negócio continuam em public até a virada da API (fase 2).

CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_municipio TEXT NOT NULL,
    uf CHAR(2) NOT NULL,
    cnpj TEXT UNIQUE,

    -- Identificador na URL. O jprocesso2 chama de "subdominio" porque roteia por subdomínio;
    -- aqui o acesso é por caminho (/iraucuba), então o nome reflete o uso real.
    slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$'),

    -- Schema Postgres do cliente. Sempre derivado do slug (mun_<slug com _ no lugar de ->),
    -- nunca digitado à mão: é interpolado em DDL, e nome livre aqui vira injeção de SQL.
    schema_nome TEXT NOT NULL UNIQUE CHECK (schema_nome ~ '^mun_[a-z0-9_]{1,50}$'),

    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    /** Logo, brasão, cores — o que for específico do cliente e não couber em coluna. */
    configuracoes JSONB NOT NULL DEFAULT '{}'::JSONB,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.clientes IS 'Cliente — município que usa o sistema. Cada um tem seu próprio schema Postgres';
COMMENT ON COLUMN public.clientes.slug IS 'Identificador na URL (ex.: /iraucuba). Minúsculas, dígitos e hífen';
COMMENT ON COLUMN public.clientes.schema_nome IS 'Schema Postgres do cliente; derivado do slug pelo provisionamento, nunca digitado';

CREATE UNIQUE INDEX idx_clientes_slug ON public.clientes (LOWER(slug));

CREATE TRIGGER trg_atualizado_em_clientes
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();

-- Só o superadmin (equipe JEOS) enxerga o cadastro de clientes, e ele não usa o cliente
-- Supabase do usuário — acessa com service role. RLS ligada e sem policy nenhuma: qualquer
-- acesso por sessão de usuário comum vê zero linhas, que é o desejado.
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Controle de quais migrations de tenant já rodaram em cada schema de município.
CREATE TABLE IF NOT EXISTS meta.migracoes_tenant (
    schema_nome TEXT NOT NULL,
    nome_arquivo TEXT NOT NULL,
    aplicado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (schema_nome, nome_arquivo)
);

COMMENT ON TABLE meta.migracoes_tenant IS 'Bookkeeping das migrations aplicadas por schema de município (equivalente de meta.migracoes_jconv para o mestre)';
