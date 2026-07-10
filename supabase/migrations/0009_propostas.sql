-- Migration 0009: Proposta (pleitos protocolados, ainda não formalizados em Convenio)

CREATE TABLE public.propostas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    orgao_concedente_id UUID NOT NULL REFERENCES public.orgaos_concedentes(id),
    esfera public.esfera_convenio, -- herdada automaticamente do orgao_concedente_id (trigger)

    objeto TEXT NOT NULL,
    numero_protocolo TEXT,
    numero_nup TEXT,

    status public.status_proposta NOT NULL DEFAULT 'EmAnalise',

    -- Preenchido pela rotina de promoção quando a proposta é aprovada e vira Convenio.
    -- O registro original é preservado como histórico (nunca excluído/convertido in-place).
    convenio_gerado_id UUID REFERENCES public.convenios(id),

    observacoes TEXT,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_convenio_gerado_apenas_se_aprovada
        CHECK (convenio_gerado_id IS NULL OR status = 'Aprovada')
);

COMMENT ON TABLE public.propostas IS 'Proposta — pleito protocolado ainda não formalizado; ao ser aprovada gera um Convenio vinculado via convenio_gerado_id, preservando o histórico original';

CREATE INDEX idx_propostas_orgao_concedente ON public.propostas (orgao_concedente_id);
CREATE INDEX idx_propostas_esfera ON public.propostas (esfera);
CREATE INDEX idx_propostas_status ON public.propostas (status);
CREATE INDEX idx_propostas_convenio_gerado ON public.propostas (convenio_gerado_id);

CREATE TRIGGER trg_herdar_esfera_propostas
    BEFORE INSERT OR UPDATE OF orgao_concedente_id ON public.propostas
    FOR EACH ROW EXECUTE FUNCTION public.herdar_esfera_orgao();

CREATE TRIGGER trg_atualizado_em_propostas
    BEFORE UPDATE ON public.propostas
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();

CREATE TRIGGER trg_audit_propostas
    AFTER INSERT OR UPDATE OR DELETE ON public.propostas
    FOR EACH ROW EXECUTE FUNCTION auditoria.gravar_evento();

ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY propostas_select ON public.propostas
    FOR SELECT USING (public.usuario_tem_acesso_orgao(orgao_concedente_id));

CREATE POLICY propostas_insert ON public.propostas
    FOR INSERT WITH CHECK (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[])
        AND public.usuario_tem_acesso_orgao(orgao_concedente_id)
    );

CREATE POLICY propostas_update ON public.propostas
    FOR UPDATE USING (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[])
        AND public.usuario_tem_acesso_orgao(orgao_concedente_id)
    )
    WITH CHECK (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[])
        AND public.usuario_tem_acesso_orgao(orgao_concedente_id)
    );

CREATE POLICY propostas_delete ON public.propostas
    FOR DELETE USING (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[])
        AND public.usuario_tem_acesso_orgao(orgao_concedente_id)
    );
