-- Migration 0012: Medicao, Repasse e Aditivo (detalhamento financeiro/contratual de um Convenio)

CREATE OR REPLACE FUNCTION public.usuario_tem_acesso_convenio(p_convenio_id UUID)
RETURNS BOOLEAN AS $$
    SELECT public.usuario_tem_acesso_orgao(orgao_concedente_id)
    FROM public.convenios WHERE id = p_convenio_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.usuario_tem_acesso_convenio IS 'Verifica acesso ao convênio pai, usado nas tabelas filhas (Medicao, Repasse, Aditivo, DocumentoAnexo)';

-- Medicao
CREATE TABLE public.medicoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    convenio_id UUID NOT NULL REFERENCES public.convenios(id) ON DELETE CASCADE,
    numero_medicao INTEGER NOT NULL,
    data DATE NOT NULL,
    percentual_acumulado NUMERIC(5,2) CHECK (percentual_acumulado BETWEEN 0 AND 100),
    valor_pago NUMERIC(15,2),
    valor_a_pagar NUMERIC(15,2),
    status public.status_medicao NOT NULL DEFAULT 'Aguardando',
    observacoes TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (convenio_id, numero_medicao)
);

COMMENT ON TABLE public.medicoes IS 'Medicao — medição de obra vinculada a um convênio';

CREATE INDEX idx_medicoes_convenio ON public.medicoes (convenio_id);

CREATE TRIGGER trg_atualizado_em_medicoes
    BEFORE UPDATE ON public.medicoes
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();

CREATE TRIGGER trg_audit_medicoes
    AFTER INSERT OR UPDATE OR DELETE ON public.medicoes
    FOR EACH ROW EXECUTE FUNCTION auditoria.gravar_evento();

-- Repasse
CREATE TABLE public.repasses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    convenio_id UUID NOT NULL REFERENCES public.convenios(id) ON DELETE CASCADE,
    tipo public.tipo_repasse NOT NULL,
    data DATE NOT NULL,
    valor NUMERIC(15,2) NOT NULL,
    observacoes TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.repasses IS 'Repasse — parcela/contrapartida liberada pelo órgão concedente para um convênio';

CREATE INDEX idx_repasses_convenio ON public.repasses (convenio_id);
CREATE INDEX idx_repasses_data ON public.repasses (data);

CREATE TRIGGER trg_atualizado_em_repasses
    BEFORE UPDATE ON public.repasses
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();

CREATE TRIGGER trg_audit_repasses
    AFTER INSERT OR UPDATE OR DELETE ON public.repasses
    FOR EACH ROW EXECUTE FUNCTION auditoria.gravar_evento();

-- Aditivo
CREATE TABLE public.aditivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    convenio_id UUID NOT NULL REFERENCES public.convenios(id) ON DELETE CASCADE,
    tipo public.tipo_aditivo NOT NULL,
    data DATE NOT NULL,
    descricao TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.aditivos IS 'Aditivo — alteração de prazo, valor ou objeto de um convênio';

CREATE INDEX idx_aditivos_convenio ON public.aditivos (convenio_id);

CREATE TRIGGER trg_atualizado_em_aditivos
    BEFORE UPDATE ON public.aditivos
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();

CREATE TRIGGER trg_audit_aditivos
    AFTER INSERT OR UPDATE OR DELETE ON public.aditivos
    FOR EACH ROW EXECUTE FUNCTION auditoria.gravar_evento();

-- RLS: mesmas regras nas três tabelas, escopo herdado do convênio pai
ALTER TABLE public.medicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repasses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aditivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY medicoes_select ON public.medicoes
    FOR SELECT USING (public.usuario_tem_acesso_convenio(convenio_id));
CREATE POLICY medicoes_insert ON public.medicoes
    FOR INSERT WITH CHECK (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        AND public.usuario_tem_acesso_convenio(convenio_id)
    );
CREATE POLICY medicoes_update ON public.medicoes
    FOR UPDATE USING (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        AND public.usuario_tem_acesso_convenio(convenio_id)
    )
    WITH CHECK (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        AND public.usuario_tem_acesso_convenio(convenio_id)
    );
CREATE POLICY medicoes_delete ON public.medicoes
    FOR DELETE USING (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[])
        AND public.usuario_tem_acesso_convenio(convenio_id)
    );

CREATE POLICY repasses_select ON public.repasses
    FOR SELECT USING (public.usuario_tem_acesso_convenio(convenio_id));
CREATE POLICY repasses_insert ON public.repasses
    FOR INSERT WITH CHECK (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        AND public.usuario_tem_acesso_convenio(convenio_id)
    );
CREATE POLICY repasses_update ON public.repasses
    FOR UPDATE USING (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        AND public.usuario_tem_acesso_convenio(convenio_id)
    )
    WITH CHECK (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        AND public.usuario_tem_acesso_convenio(convenio_id)
    );
CREATE POLICY repasses_delete ON public.repasses
    FOR DELETE USING (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[])
        AND public.usuario_tem_acesso_convenio(convenio_id)
    );

CREATE POLICY aditivos_select ON public.aditivos
    FOR SELECT USING (public.usuario_tem_acesso_convenio(convenio_id));
CREATE POLICY aditivos_insert ON public.aditivos
    FOR INSERT WITH CHECK (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[])
        AND public.usuario_tem_acesso_convenio(convenio_id)
    );
CREATE POLICY aditivos_update ON public.aditivos
    FOR UPDATE USING (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[])
        AND public.usuario_tem_acesso_convenio(convenio_id)
    )
    WITH CHECK (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[])
        AND public.usuario_tem_acesso_convenio(convenio_id)
    );
CREATE POLICY aditivos_delete ON public.aditivos
    FOR DELETE USING (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[])
        AND public.usuario_tem_acesso_convenio(convenio_id)
    );
