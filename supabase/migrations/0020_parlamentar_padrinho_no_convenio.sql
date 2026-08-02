-- Migration 0020: parlamentar/padrinho passa a ser do Convenio (fase "expand")
--
-- O padrinho é da emenda/convênio, não do órgão: o mesmo ministério recebe emendas de vários
-- parlamentares, então o campo no órgão obrigava a criar um órgão duplicado por padrinho
-- (é o que se vê hoje em nomes como "FUNASA DANILO FORTE" e "Emenda Parlamentar (Eduardo Girão)").
--
-- Esta migration só ADICIONA. A remoção de orgaos_concedentes.parlamentar_padrinho ficou na
-- 0021, para ser aplicada depois do deploy do código novo — enquanto a versão publicada da API
-- ainda gravar naquela coluna, derrubá-la quebraria o cadastro de órgão em produção.

ALTER TABLE public.convenios ADD COLUMN parlamentar_padrinho TEXT;

COMMENT ON COLUMN public.convenios.parlamentar_padrinho IS 'Parlamentar/padrinho da emenda que originou o convênio (antes ficava em orgaos_concedentes)';

-- Backfill: a importação da planilha gravava o padrinho dentro de observacoes, no formato
-- "Parlamentar/padrinho: <nome> | ...". Passa esses valores para a coluna própria.
-- O texto em observacoes é preservado de propósito, para não perder o rastro da importação.
UPDATE public.convenios
SET parlamentar_padrinho = btrim(substring(observacoes FROM 'Parlamentar/padrinho: ([^|]+)'))
WHERE observacoes LIKE '%Parlamentar/padrinho:%'
  AND btrim(coalesce(substring(observacoes FROM 'Parlamentar/padrinho: ([^|]+)'), '')) <> '';
