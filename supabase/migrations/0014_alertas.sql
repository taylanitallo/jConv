-- Migration 0014: Alerta (vigência, contrato de empresa, suspensiva, PC pendente, obra parada)

CREATE TABLE public.alertas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    convenio_id UUID NOT NULL REFERENCES public.convenios(id) ON DELETE CASCADE,
    tipo public.tipo_alerta NOT NULL,
    data_disparo TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status public.status_alerta NOT NULL DEFAULT 'Pendente',
    descricao TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.alertas IS 'Alerta — aviso automático (vigência, contrato de empresa, suspensiva, PC pendente, obra parada) de um convênio';

CREATE INDEX idx_alertas_convenio ON public.alertas (convenio_id);
CREATE INDEX idx_alertas_status ON public.alertas (status);
CREATE INDEX idx_alertas_tipo ON public.alertas (tipo);

CREATE TRIGGER trg_atualizado_em_alertas
    BEFORE UPDATE ON public.alertas
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();

CREATE TRIGGER trg_audit_alertas
    AFTER INSERT OR UPDATE OR DELETE ON public.alertas
    FOR EACH ROW EXECUTE FUNCTION auditoria.gravar_evento();

ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

-- Alertas são gerados automaticamente (motor de alertas, Fase 4); usuários apenas leem e
-- atualizam o status (lido/resolvido). Sem policy de INSERT/DELETE para papéis de usuário comuns
-- porque a geração é feita por rotina server-side com a service role (que ignora RLS).

CREATE POLICY alertas_select ON public.alertas
    FOR SELECT USING (public.usuario_tem_acesso_convenio(convenio_id));

CREATE POLICY alertas_update ON public.alertas
    FOR UPDATE USING (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        AND public.usuario_tem_acesso_convenio(convenio_id)
    )
    WITH CHECK (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        AND public.usuario_tem_acesso_convenio(convenio_id)
    );
