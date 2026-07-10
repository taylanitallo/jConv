-- Migration 0011: LimiteCusteio (tetos financeiros por portaria — PAP/MAC — não são convênios individuais)

CREATE TABLE public.limites_custeio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    orgao_concedente_id UUID NOT NULL REFERENCES public.orgaos_concedentes(id),
    esfera public.esfera_convenio, -- herdada automaticamente do orgao_concedente_id (trigger)

    tipo public.tipo_limite_custeio NOT NULL,
    portaria_referencia TEXT,
    competencia_ano INTEGER NOT NULL,

    valor_teto NUMERIC(15,2) NOT NULL,
    valor_utilizado NUMERIC(15,2) NOT NULL DEFAULT 0,
    saldo NUMERIC(15,2) GENERATED ALWAYS AS (valor_teto - valor_utilizado) STORED,

    observacoes TEXT,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.limites_custeio IS 'LimiteCusteio — teto financeiro por portaria (ex. PAP/MAC), não representa um convênio individual';

CREATE INDEX idx_limites_custeio_orgao_concedente ON public.limites_custeio (orgao_concedente_id);
CREATE INDEX idx_limites_custeio_esfera ON public.limites_custeio (esfera);
CREATE INDEX idx_limites_custeio_competencia_ano ON public.limites_custeio (competencia_ano);

CREATE TRIGGER trg_herdar_esfera_limites_custeio
    BEFORE INSERT OR UPDATE OF orgao_concedente_id ON public.limites_custeio
    FOR EACH ROW EXECUTE FUNCTION public.herdar_esfera_orgao();

CREATE TRIGGER trg_atualizado_em_limites_custeio
    BEFORE UPDATE ON public.limites_custeio
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();

CREATE TRIGGER trg_audit_limites_custeio
    AFTER INSERT OR UPDATE OR DELETE ON public.limites_custeio
    FOR EACH ROW EXECUTE FUNCTION auditoria.gravar_evento();

ALTER TABLE public.limites_custeio ENABLE ROW LEVEL SECURITY;

CREATE POLICY limites_custeio_select ON public.limites_custeio
    FOR SELECT USING (public.usuario_tem_acesso_orgao(orgao_concedente_id));

CREATE POLICY limites_custeio_insert ON public.limites_custeio
    FOR INSERT WITH CHECK (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        AND public.usuario_tem_acesso_orgao(orgao_concedente_id)
    );

CREATE POLICY limites_custeio_update ON public.limites_custeio
    FOR UPDATE USING (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        AND public.usuario_tem_acesso_orgao(orgao_concedente_id)
    )
    WITH CHECK (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        AND public.usuario_tem_acesso_orgao(orgao_concedente_id)
    );

CREATE POLICY limites_custeio_delete ON public.limites_custeio
    FOR DELETE USING (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[])
        AND public.usuario_tem_acesso_orgao(orgao_concedente_id)
    );
