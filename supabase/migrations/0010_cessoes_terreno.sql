-- Migration 0010: CessaoTerreno (processo de cessão de terreno, sem valores financeiros)

CREATE TABLE public.cessoes_terreno (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    orgao_concedente_id UUID NOT NULL REFERENCES public.orgaos_concedentes(id),
    esfera public.esfera_convenio, -- herdada automaticamente do orgao_concedente_id (trigger)

    objeto TEXT NOT NULL,
    numero_protocolo TEXT,
    numero_nup TEXT,
    responsavel_interno TEXT,

    status public.status_cessao_terreno NOT NULL DEFAULT 'DocumentacaoEmAnalise',

    observacoes TEXT,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cessoes_terreno IS 'CessaoTerreno — processo de cessão de terreno vinculado a um órgão concedente, sem valores financeiros';

CREATE INDEX idx_cessoes_terreno_orgao_concedente ON public.cessoes_terreno (orgao_concedente_id);
CREATE INDEX idx_cessoes_terreno_esfera ON public.cessoes_terreno (esfera);
CREATE INDEX idx_cessoes_terreno_status ON public.cessoes_terreno (status);

CREATE TRIGGER trg_herdar_esfera_cessoes_terreno
    BEFORE INSERT OR UPDATE OF orgao_concedente_id ON public.cessoes_terreno
    FOR EACH ROW EXECUTE FUNCTION public.herdar_esfera_orgao();

CREATE TRIGGER trg_atualizado_em_cessoes_terreno
    BEFORE UPDATE ON public.cessoes_terreno
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();

CREATE TRIGGER trg_audit_cessoes_terreno
    AFTER INSERT OR UPDATE OR DELETE ON public.cessoes_terreno
    FOR EACH ROW EXECUTE FUNCTION auditoria.gravar_evento();

ALTER TABLE public.cessoes_terreno ENABLE ROW LEVEL SECURITY;

CREATE POLICY cessoes_terreno_select ON public.cessoes_terreno
    FOR SELECT USING (public.usuario_tem_acesso_orgao(orgao_concedente_id));

CREATE POLICY cessoes_terreno_insert ON public.cessoes_terreno
    FOR INSERT WITH CHECK (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[])
        AND public.usuario_tem_acesso_orgao(orgao_concedente_id)
    );

CREATE POLICY cessoes_terreno_update ON public.cessoes_terreno
    FOR UPDATE USING (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[])
        AND public.usuario_tem_acesso_orgao(orgao_concedente_id)
    )
    WITH CHECK (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[])
        AND public.usuario_tem_acesso_orgao(orgao_concedente_id)
    );

CREATE POLICY cessoes_terreno_delete ON public.cessoes_terreno
    FOR DELETE USING (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[])
        AND public.usuario_tem_acesso_orgao(orgao_concedente_id)
    );
