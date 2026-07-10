-- Migration 0008: Convenio (entidade central)

CREATE TABLE public.convenios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_sequencial INTEGER GENERATED ALWAYS AS IDENTITY,

    orgao_concedente_id UUID NOT NULL REFERENCES public.orgaos_concedentes(id),
    esfera public.esfera_convenio, -- herdada automaticamente do orgao_concedente_id (trigger), nunca digitada

    tipo_instrumento public.tipo_instrumento NOT NULL,
    objeto TEXT NOT NULL,

    valor_conveniado NUMERIC(15,2),
    valor_concedido NUMERIC(15,2),
    valor_contrapartida NUMERIC(15,2),
    valor_licitado NUMERIC(15,2),

    numero_convenio TEXT,
    numero_mapp TEXT,
    numero_sic TEXT,
    numero_proposta TEXT,
    numero_protocolo TEXT,
    numero_nup TEXT,
    numero_operacao_caixa TEXT,
    conta_bancaria TEXT,

    data_assinatura DATE,
    data_inicio_vigencia DATE,
    data_fim_vigencia DATE,

    empresa_contratada_id UUID REFERENCES public.empresas_contratadas(id),
    vigencia_contrato_empresa DATE,

    saldo_em_conta NUMERIC(15,2),
    saldo_em_conta_referencia_em DATE,

    status_geral public.status_geral_convenio NOT NULL DEFAULT 'EmElaboracaoProjeto',
    percentual_executado_fisico NUMERIC(5,2) CHECK (percentual_executado_fisico BETWEEN 0 AND 100),
    percentual_executado_financeiro NUMERIC(5,2) CHECK (percentual_executado_financeiro BETWEEN 0 AND 100),

    observacoes TEXT,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_operacao_caixa_apenas_esfera_caixa
        CHECK (numero_operacao_caixa IS NULL OR esfera = 'CaixaEconomica')
);

COMMENT ON TABLE public.convenios IS 'Convenio — entidade central: convênios/termos/emendas/contratos de repasse formalizados ou em execução';
COMMENT ON COLUMN public.convenios.esfera IS 'Herdada automaticamente do OrgaoConcedente (trg_herdar_esfera_convenios), não editável diretamente';

CREATE INDEX idx_convenios_orgao_concedente ON public.convenios (orgao_concedente_id);
CREATE INDEX idx_convenios_empresa_contratada ON public.convenios (empresa_contratada_id);
CREATE INDEX idx_convenios_esfera ON public.convenios (esfera);
CREATE INDEX idx_convenios_status_geral ON public.convenios (status_geral);
CREATE INDEX idx_convenios_data_fim_vigencia ON public.convenios (data_fim_vigencia);

CREATE TRIGGER trg_herdar_esfera_convenios
    BEFORE INSERT OR UPDATE OF orgao_concedente_id ON public.convenios
    FOR EACH ROW EXECUTE FUNCTION public.herdar_esfera_orgao();

CREATE TRIGGER trg_atualizado_em_convenios
    BEFORE UPDATE ON public.convenios
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();

CREATE TRIGGER trg_audit_convenios
    AFTER INSERT OR UPDATE OR DELETE ON public.convenios
    FOR EACH ROW EXECUTE FUNCTION auditoria.gravar_evento();

ALTER TABLE public.convenios ENABLE ROW LEVEL SECURITY;

CREATE POLICY convenios_select ON public.convenios
    FOR SELECT USING (public.usuario_tem_acesso_orgao(orgao_concedente_id));

CREATE POLICY convenios_insert ON public.convenios
    FOR INSERT WITH CHECK (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        AND public.usuario_tem_acesso_orgao(orgao_concedente_id)
    );

CREATE POLICY convenios_update ON public.convenios
    FOR UPDATE USING (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        AND public.usuario_tem_acesso_orgao(orgao_concedente_id)
    )
    WITH CHECK (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        AND public.usuario_tem_acesso_orgao(orgao_concedente_id)
    );

CREATE POLICY convenios_delete ON public.convenios
    FOR DELETE USING (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[])
        AND public.usuario_tem_acesso_orgao(orgao_concedente_id)
    );
