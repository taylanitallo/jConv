-- Teste de cobertura de RLS do jConv
-- Executado via `pnpm test:rls` (psql). Falha (RAISE EXCEPTION) se qualquer tabela de negócio
-- ficar sem RLS habilitado ou sem nenhuma política de SELECT — a forma mais comum de vazamento
-- de dados é simplesmente esquecer de habilitar RLS numa tabela nova.
--
-- Tabelas cuja ausência de política de INSERT/UPDATE/DELETE é intencional (ex.: alertas são
-- gerados só pela rotina server-side com service role, que ignora RLS) ficam no allowlist abaixo.

DO $$
DECLARE
    v_tabela RECORD;
    v_falhas TEXT[] := ARRAY[]::TEXT[];

    -- Tabelas que legitimamente não têm policy de INSERT (geradas por rotina/trigger server-side)
    v_sem_policy_insert TEXT[] := ARRAY['alertas', 'eventos'];
    -- Tabelas que legitimamente não têm policy de UPDATE (link tables sem colunas próprias, ou
    -- tabelas só-leitura para o usuário final)
    v_sem_policy_update TEXT[] := ARRAY['usuarios_orgaos', 'eventos'];
    -- Tabelas que legitimamente não têm policy de DELETE (preserva histórico/auditoria)
    v_sem_policy_delete TEXT[] := ARRAY['usuarios', 'alertas', 'eventos'];
BEGIN
    -- 1. Toda tabela base de public e auditoria precisa ter RLS habilitado
    FOR v_tabela IN
        SELECT n.nspname AS schema, c.relname AS tabela
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'r'
          AND n.nspname IN ('public', 'auditoria')
        ORDER BY 1, 2
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = v_tabela.schema AND c.relname = v_tabela.tabela AND c.relrowsecurity
        ) THEN
            v_falhas := array_append(v_falhas, format('%I.%I: RLS não habilitado', v_tabela.schema, v_tabela.tabela));
        END IF;

        -- 2. Toda tabela com RLS precisa de ao menos uma política de SELECT
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = v_tabela.schema AND tablename = v_tabela.tabela AND cmd = 'SELECT'
        ) THEN
            v_falhas := array_append(v_falhas, format('%I.%I: sem política de SELECT', v_tabela.schema, v_tabela.tabela));
        END IF;

        -- 3. INSERT/UPDATE/DELETE: exigidos, exceto tabelas no allowlist acima
        IF NOT (v_tabela.tabela = ANY(v_sem_policy_insert)) AND NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = v_tabela.schema AND tablename = v_tabela.tabela AND cmd = 'INSERT'
        ) THEN
            v_falhas := array_append(v_falhas, format('%I.%I: sem política de INSERT (adicione ao allowlist se for intencional)', v_tabela.schema, v_tabela.tabela));
        END IF;

        IF NOT (v_tabela.tabela = ANY(v_sem_policy_update)) AND NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = v_tabela.schema AND tablename = v_tabela.tabela AND cmd = 'UPDATE'
        ) THEN
            v_falhas := array_append(v_falhas, format('%I.%I: sem política de UPDATE (adicione ao allowlist se for intencional)', v_tabela.schema, v_tabela.tabela));
        END IF;

        IF NOT (v_tabela.tabela = ANY(v_sem_policy_delete)) AND NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = v_tabela.schema AND tablename = v_tabela.tabela AND cmd = 'DELETE'
        ) THEN
            v_falhas := array_append(v_falhas, format('%I.%I: sem política de DELETE (adicione ao allowlist se for intencional)', v_tabela.schema, v_tabela.tabela));
        END IF;
    END LOOP;

    IF array_length(v_falhas, 1) > 0 THEN
        RAISE EXCEPTION 'Cobertura de RLS falhou (% problema(s)):%', array_length(v_falhas, 1), E'\n - ' || array_to_string(v_falhas, E'\n - ');
    END IF;

    RAISE NOTICE 'Cobertura de RLS OK: todas as tabelas de public e auditoria têm RLS habilitado com as políticas esperadas.';
END $$;
