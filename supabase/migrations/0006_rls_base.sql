-- Migration 0006: RLS das tabelas base (OrgaoConcedente, EmpresaContratada, Usuario, UsuarioOrgao)
-- Gerenciamento de Usuários e Cadastro de Entidades base: escrita restrita a Administrador/GestorConvenios;
-- leitura de OrgaoConcedente respeita o escopo do LeituraSecretario via usuario_tem_acesso_orgao.

ALTER TABLE public.orgaos_concedentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas_contratadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_orgaos ENABLE ROW LEVEL SECURITY;

-- OrgaoConcedente: leitura respeita escopo por secretaria; escrita só Administrador/GestorConvenios
CREATE POLICY orgaos_concedentes_select ON public.orgaos_concedentes
    FOR SELECT USING (public.usuario_tem_acesso_orgao(id));

CREATE POLICY orgaos_concedentes_insert ON public.orgaos_concedentes
    FOR INSERT WITH CHECK (public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[]));

CREATE POLICY orgaos_concedentes_update ON public.orgaos_concedentes
    FOR UPDATE USING (public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[]))
    WITH CHECK (public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[]));

CREATE POLICY orgaos_concedentes_delete ON public.orgaos_concedentes
    FOR DELETE USING (public.tem_papel(ARRAY['Administrador']::public.papel_usuario[]));

-- EmpresaContratada: não tem órgão próprio, visível a qualquer usuário ativo; escrita só Administrador/GestorConvenios
CREATE POLICY empresas_contratadas_select ON public.empresas_contratadas
    FOR SELECT USING (public.papel_usuario_atual() IS NOT NULL);

CREATE POLICY empresas_contratadas_insert ON public.empresas_contratadas
    FOR INSERT WITH CHECK (public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[]));

CREATE POLICY empresas_contratadas_update ON public.empresas_contratadas
    FOR UPDATE USING (public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[]))
    WITH CHECK (public.tem_papel(ARRAY['Administrador', 'GestorConvenios']::public.papel_usuario[]));

CREATE POLICY empresas_contratadas_delete ON public.empresas_contratadas
    FOR DELETE USING (public.tem_papel(ARRAY['Administrador']::public.papel_usuario[]));

-- Usuario: gerenciamento restrito ao Administrador; qualquer usuário pode ler o próprio registro
CREATE POLICY usuarios_select ON public.usuarios
    FOR SELECT USING (id = auth.uid() OR public.tem_papel(ARRAY['Administrador']::public.papel_usuario[]));

CREATE POLICY usuarios_insert ON public.usuarios
    FOR INSERT WITH CHECK (public.tem_papel(ARRAY['Administrador']::public.papel_usuario[]));

CREATE POLICY usuarios_update ON public.usuarios
    FOR UPDATE USING (public.tem_papel(ARRAY['Administrador']::public.papel_usuario[]))
    WITH CHECK (public.tem_papel(ARRAY['Administrador']::public.papel_usuario[]));

-- Sem policy de DELETE: usuário é desativado (ativo = FALSE), nunca excluído (preserva histórico de auditoria)

-- UsuarioOrgao: gerenciamento restrito ao Administrador; usuário pode ler os próprios vínculos
CREATE POLICY usuarios_orgaos_select ON public.usuarios_orgaos
    FOR SELECT USING (usuario_id = auth.uid() OR public.tem_papel(ARRAY['Administrador']::public.papel_usuario[]));

CREATE POLICY usuarios_orgaos_insert ON public.usuarios_orgaos
    FOR INSERT WITH CHECK (public.tem_papel(ARRAY['Administrador']::public.papel_usuario[]));

CREATE POLICY usuarios_orgaos_delete ON public.usuarios_orgaos
    FOR DELETE USING (public.tem_papel(ARRAY['Administrador']::public.papel_usuario[]));
