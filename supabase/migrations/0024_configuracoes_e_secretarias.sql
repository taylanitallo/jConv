-- Migration 0024: módulo de Configurações (dados do município, parâmetros gerais, layout)
-- e cadastro de Secretarias, que passa a ser o escopo de acesso do perfil LeituraSecretario.
--
-- Antes, "secretaria" existia só como conceito: o LeituraSecretario era amarrado direto a
-- órgãos concedentes em usuarios_orgaos. Agora o usuário pertence a uma Secretaria e é ela que
-- aponta para os órgãos — que é como a prefeitura de fato se organiza.
--
-- usuarios_orgaos NÃO é removida aqui: a API publicada ainda lê e grava nela. A remoção fica
-- na 0025, para rodar depois do deploy do código novo (mesmo cuidado da 0020/0021).

-- ---------------------------------------------------------------------------
-- Configurações do sistema (linha única)
-- ---------------------------------------------------------------------------
CREATE TABLE public.configuracoes (
    -- Singleton com id fixo: o CHECK impede uma segunda linha. Precisa ser UUID (e não um
    -- booleano) porque auditoria.gravar_evento() faz (dados->>'id')::UUID em toda tabela
    -- auditada — com PK booleana o trigger de auditoria estoura na primeira inserção.
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'
        CHECK (id = '00000000-0000-0000-0000-000000000001'),

    -- Aba "Município"
    municipio_nome TEXT NOT NULL DEFAULT 'Irauçuba',
    municipio_uf TEXT NOT NULL DEFAULT 'CE',
    municipio_cnpj TEXT,
    municipio_endereco TEXT,
    municipio_telefone TEXT,
    prefeito_nome TEXT,
    brasao_url TEXT,

    -- Aba "Gerais": limiares que estavam fixos em alertas.service.ts
    dias_alerta_vigencia INTEGER NOT NULL DEFAULT 90 CHECK (dias_alerta_vigencia BETWEEN 1 AND 365),
    dias_alerta_contrato_empresa INTEGER NOT NULL DEFAULT 60 CHECK (dias_alerta_contrato_empresa BETWEEN 1 AND 365),
    orgao_gestor TEXT,
    email_contato TEXT,

    -- Aba "Layout"
    orientacao_padrao_pdf TEXT NOT NULL DEFAULT 'retrato'
        CHECK (orientacao_padrao_pdf IN ('retrato', 'paisagem')),
    mostrar_brasao_relatorio BOOLEAN NOT NULL DEFAULT TRUE,
    rodape_relatorio TEXT,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.configuracoes IS 'Configuracao — linha única com os parâmetros do sistema (município, alertas, layout dos relatórios)';

CREATE TRIGGER trg_atualizado_em_configuracoes
    BEFORE UPDATE ON public.configuracoes
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();

CREATE TRIGGER trg_audit_configuracoes
    AFTER INSERT OR UPDATE OR DELETE ON public.configuracoes
    FOR EACH ROW EXECUTE FUNCTION auditoria.gravar_evento();

-- A linha nasce junto com a tabela: o sistema nunca deve ficar sem configuração.
INSERT INTO public.configuracoes (municipio_nome, municipio_uf, orgao_gestor)
VALUES ('Irauçuba', 'CE', 'Prefeitura Municipal de Irauçuba');

-- ---------------------------------------------------------------------------
-- Secretarias
-- ---------------------------------------------------------------------------
CREATE TABLE public.secretarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    sigla TEXT,
    secretario_responsavel TEXT,
    contato TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.secretarias IS 'Secretaria — secretaria municipal; define o escopo de órgãos concedentes que o perfil LeituraSecretario enxerga';

CREATE UNIQUE INDEX idx_secretarias_nome ON public.secretarias (LOWER(nome));

CREATE TRIGGER trg_atualizado_em_secretarias
    BEFORE UPDATE ON public.secretarias
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();

CREATE TRIGGER trg_audit_secretarias
    AFTER INSERT OR UPDATE OR DELETE ON public.secretarias
    FOR EACH ROW EXECUTE FUNCTION auditoria.gravar_evento();

-- Órgãos concedentes de cada secretaria: é este vínculo que o RLS passa a consultar.
CREATE TABLE public.secretarias_orgaos (
    secretaria_id UUID NOT NULL REFERENCES public.secretarias(id) ON DELETE CASCADE,
    orgao_concedente_id UUID NOT NULL REFERENCES public.orgaos_concedentes(id) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (secretaria_id, orgao_concedente_id)
);

COMMENT ON TABLE public.secretarias_orgaos IS 'Vínculo N:N Secretaria ↔ OrgaoConcedente — substitui o antigo usuarios_orgaos';

CREATE INDEX idx_secretarias_orgaos_orgao ON public.secretarias_orgaos (orgao_concedente_id);

-- Usuário passa a pertencer a uma secretaria.
ALTER TABLE public.usuarios ADD COLUMN secretaria_id UUID REFERENCES public.secretarias(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.usuarios.secretaria_id IS 'Secretaria do usuário; para LeituraSecretario define quais órgãos ele enxerga';

CREATE INDEX idx_usuarios_secretaria ON public.usuarios (secretaria_id);

-- Não havia nenhum vínculo usuário↔órgão quando esta migration foi escrita, então não há o que
-- converter. Se houver, aborta em vez de descartar o escopo de alguém silenciosamente.
DO $$
DECLARE total INTEGER;
BEGIN
    SELECT count(*) INTO total FROM public.usuarios_orgaos;
    IF total > 0 THEN
        RAISE EXCEPTION 'Existem % vínculo(s) em usuarios_orgaos que precisam virar Secretarias antes desta migration', total;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Escopo de acesso: agora passa pela secretaria do usuário
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.usuario_tem_acesso_orgao(p_orgao_concedente_id UUID)
RETURNS BOOLEAN AS $$
    SELECT
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        OR EXISTS (
            SELECT 1
            FROM public.usuarios u
            JOIN public.secretarias_orgaos so ON so.secretaria_id = u.secretaria_id
            WHERE u.id = auth.uid()
              AND u.ativo = TRUE
              AND so.orgao_concedente_id = p_orgao_concedente_id
        );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.usuario_tem_acesso_orgao IS 'Verifica acesso ao órgão concedente: papéis amplos veem tudo; LeituraSecretario vê os órgãos da sua secretaria';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secretarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secretarias_orgaos ENABLE ROW LEVEL SECURITY;

-- Configuração é lida por toda a aplicação (cabeçalho de relatório, nome do município), mas
-- só Administrador altera.
CREATE POLICY configuracoes_select ON public.configuracoes
    FOR SELECT USING (public.papel_usuario_atual() IS NOT NULL);
CREATE POLICY configuracoes_update ON public.configuracoes
    FOR UPDATE USING (public.tem_papel(ARRAY['Administrador']::public.papel_usuario[]))
    WITH CHECK (public.tem_papel(ARRAY['Administrador']::public.papel_usuario[]));

-- Sem política de INSERT/DELETE: a linha única já existe e não deve ser recriada nem apagada.

CREATE POLICY secretarias_select ON public.secretarias
    FOR SELECT USING (public.papel_usuario_atual() IS NOT NULL);
CREATE POLICY secretarias_insert ON public.secretarias
    FOR INSERT WITH CHECK (public.tem_papel(ARRAY['Administrador']::public.papel_usuario[]));
CREATE POLICY secretarias_update ON public.secretarias
    FOR UPDATE USING (public.tem_papel(ARRAY['Administrador']::public.papel_usuario[]))
    WITH CHECK (public.tem_papel(ARRAY['Administrador']::public.papel_usuario[]));
CREATE POLICY secretarias_delete ON public.secretarias
    FOR DELETE USING (public.tem_papel(ARRAY['Administrador']::public.papel_usuario[]));

CREATE POLICY secretarias_orgaos_select ON public.secretarias_orgaos
    FOR SELECT USING (public.papel_usuario_atual() IS NOT NULL);
CREATE POLICY secretarias_orgaos_insert ON public.secretarias_orgaos
    FOR INSERT WITH CHECK (public.tem_papel(ARRAY['Administrador']::public.papel_usuario[]));
CREATE POLICY secretarias_orgaos_delete ON public.secretarias_orgaos
    FOR DELETE USING (public.tem_papel(ARRAY['Administrador']::public.papel_usuario[]));
