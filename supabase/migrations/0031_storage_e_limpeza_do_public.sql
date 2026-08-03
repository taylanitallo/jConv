-- Migration 0031: fecha o acesso direto ao Storage e tira os dados de negócio de public
--
-- Duas pontas soltas da virada para multi-tenant.

-- 1) Storage
--
-- As policies do bucket chamavam pode_ver('Convenios') sem qualificar o schema. O serviço de
-- Storage roda com search_path em public, então a autorização de arquivo de QUALQUER município
-- era decidida pelas permissões gravadas em public — as de uma prefeitura valendo para todas.
--
-- Uma policy de bucket não tem como saber de qual município é a requisição: o bucket é um só. A
-- decisão passa a ser da API, que já roda o guard de permissão e lê o documento no schema do
-- município antes de gerar a URL. As URLs assinadas que ela devolve são pré-autorizadas e não
-- dependem de RLS, então o navegador continua subindo e baixando arquivo direto do Storage.
DROP POLICY IF EXISTS documentos_anexos_storage_select ON storage.objects;
DROP POLICY IF EXISTS documentos_anexos_storage_insert ON storage.objects;
DROP POLICY IF EXISTS documentos_anexos_storage_delete ON storage.objects;

-- Sem policy nenhuma e com RLS ligada, o papel authenticated não alcança mais o bucket direto.
-- Só service_role (a API) e as URLs assinadas que ela emite.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'storage' AND tablename = 'objects'
       AND policyname LIKE 'documentos_anexos%'
  ) THEN
    RAISE EXCEPTION 'Ainda há policy de documentos_anexos no storage';
  END IF;
END $$;

-- 2) Limpeza do public
--
-- Os dados de negócio já foram copiados e conferidos em mun_iraucuba. As tabelas em public são
-- de uma prefeitura só, num sistema que agora atende várias — e enquanto existirem, uma consulta
-- que erre o search_path lê dados do município errado em silêncio, em vez de falhar.
--
-- Elas são MOVIDAS, não removidas: um município inteiro é caro demais para apagar por confiança
-- num teste. Voltar é um ALTER TABLE ... SET SCHEMA public de cada uma.
CREATE SCHEMA IF NOT EXISTS arquivo_pre_multitenant;

DO $$
DECLARE
  tabela TEXT;
  copiadas INTEGER;
  originais INTEGER;
BEGIN
  FOREACH tabela IN ARRAY ARRAY[
    'alertas', 'documentos_anexos', 'limites_custeio', 'cessoes_terreno', 'propostas',
    'repasses', 'medicoes', 'aditivos', 'observacoes_convenio', 'convenios',
    'permissoes_usuario', 'usuarios', 'empresas_contratadas', 'secretarias_orgaos',
    'orgaos_concedentes', 'secretarias', 'configuracoes'
  ]
  LOOP
    IF to_regclass('public.' || quote_ident(tabela)) IS NULL THEN
      CONTINUE;
    END IF;

    -- Trava de segurança: só sai de public o que comprovadamente já está no schema do município.
    EXECUTE format('SELECT count(*) FROM public.%I', tabela) INTO originais;
    EXECUTE format('SELECT count(*) FROM mun_iraucuba.%I', tabela) INTO copiadas;

    IF copiadas < originais THEN
      RAISE EXCEPTION
        'public.% tem % linha(s) e mun_iraucuba.% tem % — a cópia não está completa, nada será movido',
        tabela, originais, tabela, copiadas;
    END IF;

    EXECUTE format('ALTER TABLE public.%I SET SCHEMA arquivo_pre_multitenant', tabela);
  END LOOP;
END $$;

-- O papel das requisições não deve enxergar o arquivo nem por acidente.
REVOKE ALL ON ALL TABLES IN SCHEMA arquivo_pre_multitenant FROM authenticated, anon;
REVOKE ALL ON SCHEMA arquivo_pre_multitenant FROM authenticated, anon;

COMMENT ON SCHEMA arquivo_pre_multitenant IS
  'Tabelas de negócio que viviam em public antes da virada multi-tenant (migration 0031). '
  'Mantidas como rede de segurança; podem ser removidas depois que o sistema rodar um tempo '
  'sobre os schemas de município.';
