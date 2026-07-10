-- Migration 0005: Funções helper para RLS
-- Funções reutilizáveis usadas nas políticas de Row Level Security de todas as tabelas de negócio

CREATE OR REPLACE FUNCTION public.papel_usuario_atual()
RETURNS public.papel_usuario AS $$
    SELECT papel FROM public.usuarios WHERE id = auth.uid() AND ativo = TRUE;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.papel_usuario_atual IS 'Retorna o papel do usuário autenticado (NULL se inexistente/desativado)';

CREATE OR REPLACE FUNCTION public.tem_papel(p_papeis public.papel_usuario[])
RETURNS BOOLEAN AS $$
    SELECT public.papel_usuario_atual() = ANY(p_papeis);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.tem_papel IS 'Verifica se o usuário autenticado tem um dos papéis especificados';

-- Acesso irrestrito (todos os órgãos): Administrador, GestorConvenios e Financeiro.
-- LeituraSecretario só enxerga os órgãos concedentes vinculados a ele em usuarios_orgaos.
CREATE OR REPLACE FUNCTION public.usuario_tem_acesso_orgao(p_orgao_concedente_id UUID)
RETURNS BOOLEAN AS $$
    SELECT
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        OR EXISTS (
            SELECT 1 FROM public.usuarios_orgaos
            WHERE usuario_id = auth.uid()
              AND orgao_concedente_id = p_orgao_concedente_id
        );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.usuario_tem_acesso_orgao IS 'Verifica se o usuário autenticado tem acesso ao órgão concedente informado, respeitando o escopo por secretaria do LeituraSecretario';
