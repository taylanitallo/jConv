-- Migration 0026: autorização por permissão de módulo, no lugar de papel fixo
--
-- Antes, o acesso era decidido por um papel único por usuário (Administrador, GestorConvenios,
-- Financeiro, LeituraSecretario) espalhado por 63 policies de RLS. Agora cada usuário recebe um
-- nível por módulo (tela):
--
--   Nenhuma  -> não enxerga o módulo
--   Parcial  -> só leitura
--   Total    -> lê, inclui, edita e exclui
--
-- A coluna usuarios.papel NÃO é removida aqui: a API publicada ainda a lê no guard de rotas. A
-- remoção fica na 0027, para rodar depois do deploy (mesmo cuidado da 0020/0021 e 0024/0025).

CREATE TYPE public.modulo_sistema AS ENUM (
    'Dashboard',
    'Convenios',
    'Propostas',
    'CessoesTerreno',
    'LimitesCusteio',
    'OrgaosConcedentes',
    'EmpresasContratadas',
    'ConfiguracoesGerais',
    'ConfiguracoesMunicipio',
    'ConfiguracoesSecretarias',
    'ConfiguracoesLayout',
    'Usuarios'
);

CREATE TYPE public.nivel_permissao AS ENUM ('Nenhuma', 'Parcial', 'Total');

CREATE TABLE public.permissoes_usuario (
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    modulo public.modulo_sistema NOT NULL,
    nivel public.nivel_permissao NOT NULL DEFAULT 'Nenhuma',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (usuario_id, modulo)
);

COMMENT ON TABLE public.permissoes_usuario IS 'Permissao — nível de acesso do usuário por módulo do sistema. Ausência de linha equivale a Nenhuma';

CREATE INDEX idx_permissoes_usuario_usuario ON public.permissoes_usuario (usuario_id);

CREATE TRIGGER trg_atualizado_em_permissoes_usuario
    BEFORE UPDATE ON public.permissoes_usuario
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();

-- ---------------------------------------------------------------------------
-- Helpers de autorização
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER porque a própria consulta a permissoes_usuario passaria pela RLS desta
-- tabela — sem isso, avaliar a permissão dependeria de ter permissão, e nada resolveria.
CREATE OR REPLACE FUNCTION public.nivel_permissao_usuario(p_modulo public.modulo_sistema)
RETURNS public.nivel_permissao AS $$
    SELECT COALESCE(
        (
            SELECT p.nivel
            FROM public.permissoes_usuario p
            JOIN public.usuarios u ON u.id = p.usuario_id
            WHERE p.usuario_id = auth.uid() AND p.modulo = p_modulo AND u.ativo = TRUE
        ),
        'Nenhuma'::public.nivel_permissao
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.nivel_permissao_usuario IS 'Nível do usuário autenticado no módulo (Nenhuma se não houver linha ou o usuário estiver inativo)';

CREATE OR REPLACE FUNCTION public.pode_ver(p_modulo public.modulo_sistema)
RETURNS BOOLEAN AS $$
    SELECT public.nivel_permissao_usuario(p_modulo) IN ('Parcial', 'Total');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.pode_editar(p_modulo public.modulo_sistema)
RETURNS BOOLEAN AS $$
    SELECT public.nivel_permissao_usuario(p_modulo) = 'Total';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Escopo por secretaria continua existindo, mas agora é ortogonal à permissão: quem tem
-- secretaria vinculada só enxerga os órgãos dela; quem não tem, não sofre recorte de órgão
-- (o que limita é o nível no módulo). Antes isso dependia do papel LeituraSecretario.
CREATE OR REPLACE FUNCTION public.usuario_tem_acesso_orgao(p_orgao_concedente_id UUID)
RETURNS BOOLEAN AS $$
    SELECT
        NOT EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid() AND ativo = TRUE AND secretaria_id IS NOT NULL
        )
        OR EXISTS (
            SELECT 1
            FROM public.usuarios u
            JOIN public.secretarias_orgaos so ON so.secretaria_id = u.secretaria_id
            WHERE u.id = auth.uid() AND u.ativo = TRUE AND so.orgao_concedente_id = p_orgao_concedente_id
        );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.usuario_tem_acesso_orgao IS 'Recorte por secretaria: sem secretaria vinculada vê todos os órgãos; com secretaria, só os dela';

-- ---------------------------------------------------------------------------
-- Backfill: converte o papel atual em permissões, ANTES de trocar as policies
-- ---------------------------------------------------------------------------
INSERT INTO public.permissoes_usuario (usuario_id, modulo, nivel)
SELECT
    u.id,
    m.modulo,
    CASE
        WHEN u.papel = 'Administrador' THEN 'Total'
        WHEN u.papel = 'GestorConvenios' THEN
            CASE WHEN m.modulo::TEXT LIKE 'Configuracoes%' OR m.modulo = 'Usuarios'
                 THEN 'Nenhuma' ELSE 'Total' END
        WHEN u.papel = 'Financeiro' THEN
            CASE WHEN m.modulo IN ('Convenios', 'LimitesCusteio') THEN 'Total'
                 WHEN m.modulo::TEXT LIKE 'Configuracoes%' OR m.modulo = 'Usuarios' THEN 'Nenhuma'
                 ELSE 'Parcial' END
        WHEN u.papel = 'LeituraSecretario' THEN
            CASE WHEN m.modulo::TEXT LIKE 'Configuracoes%' OR m.modulo = 'Usuarios'
                 THEN 'Nenhuma' ELSE 'Parcial' END
        ELSE 'Nenhuma'
    END::public.nivel_permissao
FROM public.usuarios u
CROSS JOIN (SELECT unnest(enum_range(NULL::public.modulo_sistema)) AS modulo) m;

-- Trava anti-tranca: um Administrador que saísse daqui sem Total em Usuarios ficaria sem poder
-- gerenciar ninguém — inclusive a si mesmo. Aborta a migration inteira nesse caso.
DO $$
DECLARE presos INTEGER;
BEGIN
    SELECT count(*) INTO presos
    FROM public.usuarios u
    WHERE u.papel = 'Administrador' AND u.ativo = TRUE
      AND NOT EXISTS (
          SELECT 1 FROM public.permissoes_usuario p
          WHERE p.usuario_id = u.id AND p.modulo = 'Usuarios' AND p.nivel = 'Total'
      );

    IF presos > 0 THEN
        RAISE EXCEPTION 'Backfill deixaria % administrador(es) sem acesso ao módulo Usuarios', presos;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Substitui TODAS as policies das tabelas de negócio
-- ---------------------------------------------------------------------------
-- Derrubadas pelo catálogo, e não por uma lista escrita à mão: uma policy esquecida
-- continuaria decidindo por papel e criaria um buraco silencioso na autorização.
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE (schemaname = 'public' AND tablename IN (
                'orgaos_concedentes', 'empresas_contratadas', 'convenios', 'propostas',
                'cessoes_terreno', 'limites_custeio', 'medicoes', 'repasses', 'aditivos',
                'documentos_anexos', 'observacoes_convenio', 'alertas', 'usuarios',
                'configuracoes', 'secretarias', 'secretarias_orgaos'
              ))
           OR (schemaname = 'auditoria' AND tablename = 'eventos')
           OR (schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'documentos_anexos_storage%')
    LOOP
        EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

ALTER TABLE public.permissoes_usuario ENABLE ROW LEVEL SECURITY;

-- Cadastros simples: leitura com Parcial, escrita só com Total.
CREATE POLICY orgaos_concedentes_select ON public.orgaos_concedentes
    FOR SELECT USING (public.pode_ver('OrgaosConcedentes') AND public.usuario_tem_acesso_orgao(id));
CREATE POLICY orgaos_concedentes_insert ON public.orgaos_concedentes
    FOR INSERT WITH CHECK (public.pode_editar('OrgaosConcedentes'));
CREATE POLICY orgaos_concedentes_update ON public.orgaos_concedentes
    FOR UPDATE USING (public.pode_editar('OrgaosConcedentes')) WITH CHECK (public.pode_editar('OrgaosConcedentes'));
CREATE POLICY orgaos_concedentes_delete ON public.orgaos_concedentes
    FOR DELETE USING (public.pode_editar('OrgaosConcedentes'));

CREATE POLICY empresas_contratadas_select ON public.empresas_contratadas
    FOR SELECT USING (public.pode_ver('EmpresasContratadas'));
CREATE POLICY empresas_contratadas_insert ON public.empresas_contratadas
    FOR INSERT WITH CHECK (public.pode_editar('EmpresasContratadas'));
CREATE POLICY empresas_contratadas_update ON public.empresas_contratadas
    FOR UPDATE USING (public.pode_editar('EmpresasContratadas')) WITH CHECK (public.pode_editar('EmpresasContratadas'));
CREATE POLICY empresas_contratadas_delete ON public.empresas_contratadas
    FOR DELETE USING (public.pode_editar('EmpresasContratadas'));

-- Convênio e tudo que pendura nele (medições, repasses, aditivos, documentos, histórico,
-- alertas) compartilham o módulo Convenios — a granularidade escolhida é por tela.
CREATE POLICY convenios_select ON public.convenios
    FOR SELECT USING (public.pode_ver('Convenios') AND public.usuario_tem_acesso_orgao(orgao_concedente_id));
CREATE POLICY convenios_insert ON public.convenios
    FOR INSERT WITH CHECK (public.pode_editar('Convenios') AND public.usuario_tem_acesso_orgao(orgao_concedente_id));
CREATE POLICY convenios_update ON public.convenios
    FOR UPDATE USING (public.pode_editar('Convenios') AND public.usuario_tem_acesso_orgao(orgao_concedente_id))
    WITH CHECK (public.pode_editar('Convenios') AND public.usuario_tem_acesso_orgao(orgao_concedente_id));
CREATE POLICY convenios_delete ON public.convenios
    FOR DELETE USING (public.pode_editar('Convenios') AND public.usuario_tem_acesso_orgao(orgao_concedente_id));

CREATE POLICY propostas_select ON public.propostas
    FOR SELECT USING (public.pode_ver('Propostas') AND public.usuario_tem_acesso_orgao(orgao_concedente_id));
CREATE POLICY propostas_insert ON public.propostas
    FOR INSERT WITH CHECK (public.pode_editar('Propostas') AND public.usuario_tem_acesso_orgao(orgao_concedente_id));
CREATE POLICY propostas_update ON public.propostas
    FOR UPDATE USING (public.pode_editar('Propostas') AND public.usuario_tem_acesso_orgao(orgao_concedente_id))
    WITH CHECK (public.pode_editar('Propostas') AND public.usuario_tem_acesso_orgao(orgao_concedente_id));
CREATE POLICY propostas_delete ON public.propostas
    FOR DELETE USING (public.pode_editar('Propostas') AND public.usuario_tem_acesso_orgao(orgao_concedente_id));

CREATE POLICY cessoes_terreno_select ON public.cessoes_terreno
    FOR SELECT USING (public.pode_ver('CessoesTerreno') AND public.usuario_tem_acesso_orgao(orgao_concedente_id));
CREATE POLICY cessoes_terreno_insert ON public.cessoes_terreno
    FOR INSERT WITH CHECK (public.pode_editar('CessoesTerreno') AND public.usuario_tem_acesso_orgao(orgao_concedente_id));
CREATE POLICY cessoes_terreno_update ON public.cessoes_terreno
    FOR UPDATE USING (public.pode_editar('CessoesTerreno') AND public.usuario_tem_acesso_orgao(orgao_concedente_id))
    WITH CHECK (public.pode_editar('CessoesTerreno') AND public.usuario_tem_acesso_orgao(orgao_concedente_id));
CREATE POLICY cessoes_terreno_delete ON public.cessoes_terreno
    FOR DELETE USING (public.pode_editar('CessoesTerreno') AND public.usuario_tem_acesso_orgao(orgao_concedente_id));

CREATE POLICY limites_custeio_select ON public.limites_custeio
    FOR SELECT USING (public.pode_ver('LimitesCusteio') AND public.usuario_tem_acesso_orgao(orgao_concedente_id));
CREATE POLICY limites_custeio_insert ON public.limites_custeio
    FOR INSERT WITH CHECK (public.pode_editar('LimitesCusteio') AND public.usuario_tem_acesso_orgao(orgao_concedente_id));
CREATE POLICY limites_custeio_update ON public.limites_custeio
    FOR UPDATE USING (public.pode_editar('LimitesCusteio') AND public.usuario_tem_acesso_orgao(orgao_concedente_id))
    WITH CHECK (public.pode_editar('LimitesCusteio') AND public.usuario_tem_acesso_orgao(orgao_concedente_id));
CREATE POLICY limites_custeio_delete ON public.limites_custeio
    FOR DELETE USING (public.pode_editar('LimitesCusteio') AND public.usuario_tem_acesso_orgao(orgao_concedente_id));

CREATE POLICY medicoes_select ON public.medicoes
    FOR SELECT USING (public.pode_ver('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));
CREATE POLICY medicoes_insert ON public.medicoes
    FOR INSERT WITH CHECK (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));
CREATE POLICY medicoes_update ON public.medicoes
    FOR UPDATE USING (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id))
    WITH CHECK (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));
CREATE POLICY medicoes_delete ON public.medicoes
    FOR DELETE USING (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));

CREATE POLICY repasses_select ON public.repasses
    FOR SELECT USING (public.pode_ver('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));
CREATE POLICY repasses_insert ON public.repasses
    FOR INSERT WITH CHECK (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));
CREATE POLICY repasses_update ON public.repasses
    FOR UPDATE USING (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id))
    WITH CHECK (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));
CREATE POLICY repasses_delete ON public.repasses
    FOR DELETE USING (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));

CREATE POLICY aditivos_select ON public.aditivos
    FOR SELECT USING (public.pode_ver('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));
CREATE POLICY aditivos_insert ON public.aditivos
    FOR INSERT WITH CHECK (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));
CREATE POLICY aditivos_update ON public.aditivos
    FOR UPDATE USING (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id))
    WITH CHECK (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));
CREATE POLICY aditivos_delete ON public.aditivos
    FOR DELETE USING (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));

CREATE POLICY documentos_anexos_select ON public.documentos_anexos
    FOR SELECT USING (public.pode_ver('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));
CREATE POLICY documentos_anexos_insert ON public.documentos_anexos
    FOR INSERT WITH CHECK (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));
CREATE POLICY documentos_anexos_update ON public.documentos_anexos
    FOR UPDATE USING (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id))
    WITH CHECK (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));
CREATE POLICY documentos_anexos_delete ON public.documentos_anexos
    FOR DELETE USING (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));

-- Histórico segue append-only: sem UPDATE/DELETE de propósito (migration 0022).
CREATE POLICY observacoes_convenio_select ON public.observacoes_convenio
    FOR SELECT USING (public.pode_ver('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));
CREATE POLICY observacoes_convenio_insert ON public.observacoes_convenio
    FOR INSERT WITH CHECK (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));

CREATE POLICY alertas_select ON public.alertas
    FOR SELECT USING (public.pode_ver('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));
CREATE POLICY alertas_update ON public.alertas
    FOR UPDATE USING (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id))
    WITH CHECK (public.pode_editar('Convenios') AND public.usuario_tem_acesso_convenio(convenio_id));

-- Configuração: uma linha só cobre as abas Gerais, Município e Layout, então a RLS usa o "ou"
-- das três. A separação por aba é feita na API e na tela.
CREATE POLICY configuracoes_select ON public.configuracoes
    FOR SELECT USING (
        public.pode_ver('ConfiguracoesGerais') OR public.pode_ver('ConfiguracoesMunicipio')
        OR public.pode_ver('ConfiguracoesLayout')
    );
CREATE POLICY configuracoes_update ON public.configuracoes
    FOR UPDATE USING (
        public.pode_editar('ConfiguracoesGerais') OR public.pode_editar('ConfiguracoesMunicipio')
        OR public.pode_editar('ConfiguracoesLayout')
    )
    WITH CHECK (
        public.pode_editar('ConfiguracoesGerais') OR public.pode_editar('ConfiguracoesMunicipio')
        OR public.pode_editar('ConfiguracoesLayout')
    );

CREATE POLICY secretarias_select ON public.secretarias
    FOR SELECT USING (public.pode_ver('ConfiguracoesSecretarias') OR public.pode_ver('Usuarios'));
CREATE POLICY secretarias_insert ON public.secretarias
    FOR INSERT WITH CHECK (public.pode_editar('ConfiguracoesSecretarias'));
CREATE POLICY secretarias_update ON public.secretarias
    FOR UPDATE USING (public.pode_editar('ConfiguracoesSecretarias')) WITH CHECK (public.pode_editar('ConfiguracoesSecretarias'));
CREATE POLICY secretarias_delete ON public.secretarias
    FOR DELETE USING (public.pode_editar('ConfiguracoesSecretarias'));

CREATE POLICY secretarias_orgaos_select ON public.secretarias_orgaos
    FOR SELECT USING (public.pode_ver('ConfiguracoesSecretarias'));
CREATE POLICY secretarias_orgaos_insert ON public.secretarias_orgaos
    FOR INSERT WITH CHECK (public.pode_editar('ConfiguracoesSecretarias'));
CREATE POLICY secretarias_orgaos_delete ON public.secretarias_orgaos
    FOR DELETE USING (public.pode_editar('ConfiguracoesSecretarias'));

-- Todo usuário lê o próprio cadastro (o layout depende disso para saber quem está logado),
-- mesmo sem permissão no módulo Usuarios.
CREATE POLICY usuarios_select ON public.usuarios
    FOR SELECT USING (id = auth.uid() OR public.pode_ver('Usuarios'));
CREATE POLICY usuarios_insert ON public.usuarios
    FOR INSERT WITH CHECK (public.pode_editar('Usuarios'));
CREATE POLICY usuarios_update ON public.usuarios
    FOR UPDATE USING (public.pode_editar('Usuarios')) WITH CHECK (public.pode_editar('Usuarios'));

-- Cada um enxerga as próprias permissões (a tela usa isso para montar o menu); alterar exige
-- Total em Usuarios.
CREATE POLICY permissoes_usuario_select ON public.permissoes_usuario
    FOR SELECT USING (usuario_id = auth.uid() OR public.pode_ver('Usuarios'));
CREATE POLICY permissoes_usuario_insert ON public.permissoes_usuario
    FOR INSERT WITH CHECK (public.pode_editar('Usuarios'));
CREATE POLICY permissoes_usuario_update ON public.permissoes_usuario
    FOR UPDATE USING (public.pode_editar('Usuarios')) WITH CHECK (public.pode_editar('Usuarios'));
CREATE POLICY permissoes_usuario_delete ON public.permissoes_usuario
    FOR DELETE USING (public.pode_editar('Usuarios'));

CREATE POLICY eventos_select ON auditoria.eventos
    FOR SELECT USING (public.pode_ver('Usuarios'));

CREATE POLICY documentos_anexos_storage_select ON storage.objects
    FOR SELECT USING (bucket_id = 'documentos-anexos' AND public.pode_ver('Convenios'));
CREATE POLICY documentos_anexos_storage_insert ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'documentos-anexos' AND public.pode_editar('Convenios'));
CREATE POLICY documentos_anexos_storage_delete ON storage.objects
    FOR DELETE USING (bucket_id = 'documentos-anexos' AND public.pode_editar('Convenios'));

-- ---------------------------------------------------------------------------
-- Verificação final: nenhuma policy pode ter sobrado decidindo por papel
-- ---------------------------------------------------------------------------
DO $$
DECLARE resquicios TEXT;
BEGIN
    SELECT string_agg(format('%s.%s/%s', schemaname, tablename, policyname), ', ')
    INTO resquicios
    FROM pg_policies
    WHERE (coalesce(qual, '') || ' ' || coalesce(with_check, '')) LIKE '%tem_papel%';

    IF resquicios IS NOT NULL THEN
        RAISE EXCEPTION 'Policies ainda decidindo por papel: %', resquicios;
    END IF;
END $$;
