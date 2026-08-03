-- Teste de cobertura de RLS do jConv
-- Executado via `pnpm test:rls` (psql). Falha (RAISE EXCEPTION) se qualquer tabela de negócio
-- ficar sem RLS habilitado ou sem nenhuma política de SELECT — a forma mais comum de vazamento
-- de dados é simplesmente esquecer de habilitar RLS numa tabela nova.
--
-- Depois da virada multi-tenant, as tabelas de negócio vivem nos schemas mun_* (um por
-- município), e não mais em public. O teste passa a varrer TODOS eles: um schema provisionado
-- com uma policy a menos é um município inteiro exposto, e a única forma de perceber isso cedo
-- é conferir cada um.
--
-- Em public sobraram só as tabelas do mestre (clientes, superadmins, acessos). Elas têm RLS
-- ligada e ZERO policies de propósito: ninguém além do service_role da API pode alcançá-las,
-- nem para ler. Por isso entram numa lista à parte, onde a exigência se inverte — ter policy
-- ali seria o defeito.

DO $$
DECLARE
    v_tabela RECORD;
    v_falhas TEXT[] := ARRAY[]::TEXT[];
    v_schemas_verificados INTEGER := 0;

    -- Tabelas do schema mestre: RLS ligada e nenhuma policy é o comportamento correto.
    v_so_do_mestre TEXT[] := ARRAY['clientes', 'superadmins', 'acessos'];

    -- Tabelas que legitimamente não têm policy de INSERT (geradas por rotina/trigger
    -- server-side, ou linha única criada pela migration — o caso de configuracoes)
    v_sem_policy_insert TEXT[] := ARRAY['alertas', 'eventos', 'configuracoes'];
    -- Tabelas que legitimamente não têm policy de UPDATE (link tables sem colunas próprias, que
    -- só nascem e morrem, ou tabelas só-leitura para o usuário final)
    v_sem_policy_update TEXT[] := ARRAY['secretarias_orgaos', 'eventos', 'observacoes_convenio'];
    -- Tabelas que legitimamente não têm policy de DELETE (preserva histórico/auditoria, ou
    -- linha única que nunca deve sumir)
    v_sem_policy_delete TEXT[] := ARRAY['usuarios', 'alertas', 'eventos', 'observacoes_convenio', 'configuracoes'];
BEGIN
    SELECT count(DISTINCT nspname) INTO v_schemas_verificados
      FROM pg_namespace WHERE nspname LIKE 'mun\_%';

    IF v_schemas_verificados = 0 THEN
        RAISE EXCEPTION 'Nenhum schema de município encontrado — o teste não estaria verificando nada';
    END IF;

    -- 1. Toda tabela base dos municípios, de auditoria e do mestre precisa ter RLS habilitado
    FOR v_tabela IN
        SELECT n.nspname AS schema, c.relname AS tabela
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'r'
          AND (n.nspname LIKE 'mun\_%' OR n.nspname IN ('public', 'auditoria'))
        ORDER BY 1, 2
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = v_tabela.schema AND c.relname = v_tabela.tabela AND c.relrowsecurity
        ) THEN
            v_falhas := array_append(v_falhas, format('%I.%I: RLS não habilitado', v_tabela.schema, v_tabela.tabela));
        END IF;

        -- Tabelas do mestre: a exigência é o contrário — nenhuma policy deve existir, porque
        -- qualquer uma delas abriria o cadastro de clientes para fora do service_role.
        IF v_tabela.schema = 'public' THEN
            IF NOT (v_tabela.tabela = ANY(v_so_do_mestre)) THEN
                v_falhas := array_append(v_falhas, format(
                    'public.%I: tabela inesperada em public — dados de negócio pertencem aos schemas mun_*',
                    v_tabela.tabela));
            ELSIF EXISTS (
                SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = v_tabela.tabela
            ) THEN
                v_falhas := array_append(v_falhas, format(
                    'public.%I: tem policy, mas o schema mestre só pode ser acessado pelo service_role',
                    v_tabela.tabela));
            END IF;
            CONTINUE;
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

    RAISE NOTICE 'Cobertura de RLS OK: % schema(s) de município, mais auditoria e o mestre.', v_schemas_verificados;
END $$;
