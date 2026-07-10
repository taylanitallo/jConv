-- Migration 0017: bucket de Storage para DocumentoAnexo + RLS de storage.objects
--
-- INSERT só exige usuário autenticado ativo (o caminho é um UUID aleatório gerado pela API, e
-- o upload ocorre ANTES do metadado em documentos_anexos existir — não há o que checar ainda).
-- SELECT/DELETE já podem checar o vínculo real com Convenio/Proposta/CessaoTerreno via join
-- com a tabela de metadados, reaproveitando usuario_tem_acesso_documento.

INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-anexos', 'documentos-anexos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY documentos_anexos_storage_insert ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documentos-anexos'
        AND public.papel_usuario_atual() IS NOT NULL
    );

CREATE POLICY documentos_anexos_storage_select ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documentos-anexos'
        AND EXISTS (
            SELECT 1 FROM public.documentos_anexos da
            WHERE da.arquivo_caminho = storage.objects.name
              AND public.usuario_tem_acesso_documento(da.convenio_id, da.proposta_id, da.cessao_terreno_id)
        )
    );

CREATE POLICY documentos_anexos_storage_delete ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documentos-anexos'
        AND EXISTS (
            SELECT 1 FROM public.documentos_anexos da
            WHERE da.arquivo_caminho = storage.objects.name
              AND public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[])
              AND public.usuario_tem_acesso_documento(da.convenio_id, da.proposta_id, da.cessao_terreno_id)
        )
    );
