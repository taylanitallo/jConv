-- Migration 0013: DocumentoAnexo (vinculado a Convenio, Proposta ou CessaoTerreno — exatamente um)

CREATE TABLE public.documentos_anexos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    convenio_id UUID REFERENCES public.convenios(id) ON DELETE CASCADE,
    proposta_id UUID REFERENCES public.propostas(id) ON DELETE CASCADE,
    cessao_terreno_id UUID REFERENCES public.cessoes_terreno(id) ON DELETE CASCADE,

    tipo public.tipo_documento_anexo NOT NULL,
    nome_arquivo TEXT NOT NULL,
    arquivo_caminho TEXT NOT NULL, -- caminho no Supabase Storage
    data_upload TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    extraido_por_ia BOOLEAN NOT NULL DEFAULT FALSE,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_documento_um_unico_pai CHECK (
        num_nonnulls(convenio_id, proposta_id, cessao_terreno_id) = 1
    )
);

COMMENT ON TABLE public.documentos_anexos IS 'DocumentoAnexo — documento anexado a um Convenio, Proposta ou CessaoTerreno (exatamente um pai)';

CREATE INDEX idx_documentos_anexos_convenio ON public.documentos_anexos (convenio_id);
CREATE INDEX idx_documentos_anexos_proposta ON public.documentos_anexos (proposta_id);
CREATE INDEX idx_documentos_anexos_cessao_terreno ON public.documentos_anexos (cessao_terreno_id);

CREATE TRIGGER trg_atualizado_em_documentos_anexos
    BEFORE UPDATE ON public.documentos_anexos
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();

CREATE TRIGGER trg_audit_documentos_anexos
    AFTER INSERT OR UPDATE OR DELETE ON public.documentos_anexos
    FOR EACH ROW EXECUTE FUNCTION auditoria.gravar_evento();

CREATE OR REPLACE FUNCTION public.usuario_tem_acesso_documento(
    p_convenio_id UUID, p_proposta_id UUID, p_cessao_terreno_id UUID
)
RETURNS BOOLEAN AS $$
    SELECT CASE
        WHEN p_convenio_id IS NOT NULL THEN public.usuario_tem_acesso_convenio(p_convenio_id)
        WHEN p_proposta_id IS NOT NULL THEN (
            SELECT public.usuario_tem_acesso_orgao(orgao_concedente_id)
            FROM public.propostas WHERE id = p_proposta_id
        )
        WHEN p_cessao_terreno_id IS NOT NULL THEN (
            SELECT public.usuario_tem_acesso_orgao(orgao_concedente_id)
            FROM public.cessoes_terreno WHERE id = p_cessao_terreno_id
        )
        ELSE FALSE
    END;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.usuario_tem_acesso_documento IS 'Verifica acesso ao DocumentoAnexo através de qualquer um dos três pais possíveis (Convenio/Proposta/CessaoTerreno)';

ALTER TABLE public.documentos_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY documentos_anexos_select ON public.documentos_anexos
    FOR SELECT USING (public.usuario_tem_acesso_documento(convenio_id, proposta_id, cessao_terreno_id));

CREATE POLICY documentos_anexos_insert ON public.documentos_anexos
    FOR INSERT WITH CHECK (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        AND public.usuario_tem_acesso_documento(convenio_id, proposta_id, cessao_terreno_id)
    );

CREATE POLICY documentos_anexos_update ON public.documentos_anexos
    FOR UPDATE USING (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        AND public.usuario_tem_acesso_documento(convenio_id, proposta_id, cessao_terreno_id)
    )
    WITH CHECK (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        AND public.usuario_tem_acesso_documento(convenio_id, proposta_id, cessao_terreno_id)
    );

CREATE POLICY documentos_anexos_delete ON public.documentos_anexos
    FOR DELETE USING (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[])
        AND public.usuario_tem_acesso_documento(convenio_id, proposta_id, cessao_terreno_id)
    );
