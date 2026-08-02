-- Migration 0023: consolida órgãos concedentes duplicados
--
-- A planilha de origem gerou 57 órgãos, boa parte deles o MESMO órgão escrito de formas
-- diferentes ("SEC. SAUDE", "SEC. SAÚDE", "Secretaria da Saúde do Estado (SEC. SAÚDE)") e
-- alguns criados só para carregar o padrinho da emenda ("DANILO SAÚDE", "SAÚDE DEP",
-- "Emenda Parlamentar (Eduardo Girão)"). Com parlamentar_padrinho agora no convênio
-- (migration 0020), esses últimos deixaram de ter motivo para existir.
--
-- REGRA DE SEGURANÇA: só se funde dentro da MESMA esfera. convenios.esfera é herdada do órgão
-- por trigger (migration 0007), então fundir entre esferas mudaria silenciosamente a esfera dos
-- convênios — que é justamente um dos filtros do Dashboard. Pares como MIDR (CaixaEconomica) e
-- MDR (Federal) ficaram de fora por isso, assim como os órgãos marcados "Novo PAC", cuja
-- distinção de programa se perderia na fusão.

-- Snapshot do estado anterior: torna a fusão reversível sem depender do backup do Supabase.
CREATE TABLE IF NOT EXISTS meta.orgaos_fundidos_0023 (
    tabela TEXT NOT NULL,
    registro_id UUID NOT NULL,
    orgao_antigo_id UUID NOT NULL,
    orgao_antigo_nome TEXT NOT NULL,
    orgao_novo_id UUID NOT NULL,
    orgao_novo_nome TEXT NOT NULL
);

COMMENT ON TABLE meta.orgaos_fundidos_0023 IS 'Snapshot pré-fusão da migration 0023: permite reapontar os registros de volta ao órgão original';

CREATE TEMP TABLE mapa_fusao (duplicado TEXT, canonico TEXT) ON COMMIT DROP;

INSERT INTO mapa_fusao (duplicado, canonico) VALUES
    -- Estadual: variações de grafia/abreviação do mesmo órgão
    ('ADECE (85) 3457.3300',       'Agência de Desenvolvimento do Estado do Ceará (ADECE)'),
    ('CASA CIVIL (FRANCISCO )',    'CASA CIVIL'),
    ('SEC CIDADES',                'Secretaria das Cidades (SEC. CIDADES)'),
    ('SEC. CIDADE',                'Secretaria das Cidades (SEC. CIDADES)'),
    ('SEC. CIDADES',               'Secretaria das Cidades (SEC. CIDADES)'),
    ('SEC. EDUCAÇÃO',              'Secretaria da Educação (SEDUC)'),
    ('SEC.EDUCAÇÃO',               'Secretaria da Educação (SEDUC)'),
    ('SEDUC',                      'Secretaria da Educação (SEDUC)'),
    ('SEC. SAUDE',                 'Secretaria da Saúde do Estado (SEC. SAÚDE)'),
    ('SEC. SAÚDE',                 'Secretaria da Saúde do Estado (SEC. SAÚDE)'),
    ('SEC. SAUDE Firmo Camurça',   'Secretaria da Saúde do Estado (SEC. SAÚDE)'),
    ('SECULT',                     'Secretaria da Cultura (SECULT)'),
    -- Federal: variações de grafia e órgãos que só existiam para carregar o padrinho
    ('FNDE SIMEC',                 'FNDE'),
    ('FNDE PAR -SIMEC',            'FNDE'),
    ('MDR',                        'Ministério do Desenvolvimento Regional (MDR)'),
    ('DANILO SAÚDE',               'Ministério da Saúde'),
    ('SAÚDE DEP',                  'Ministério da Saúde'),
    ('FNS Bancada do Ceará',       'Fundo Nacional de Saúde (FNS)'),
    ('MAPA EMENDA 27000010',       'Ministério da Agricultura, Pecuária e Abastecimento (MAPA)'),
    ('Emenda Parlamentar (Eduardo Girão)', 'Não informado'),
    -- CaixaEconomica
    ('MIN. DAS CIDADES',           'Min CIDADES'),
    ('MIDR EMENDA COMISSÃO',       'MIDR');

-- Falha alto e cedo se algum nome do mapa não existir mais (evita fusão parcial silenciosa).
DO $$
DECLARE ausente TEXT;
BEGIN
    SELECT string_agg(nome, ', ') INTO ausente FROM (
        SELECT duplicado AS nome FROM mapa_fusao
        UNION SELECT canonico FROM mapa_fusao
    ) t WHERE NOT EXISTS (SELECT 1 FROM public.orgaos_concedentes o WHERE o.nome = t.nome);

    IF ausente IS NOT NULL THEN
        RAISE EXCEPTION 'Órgãos do mapa de fusão não encontrados: %', ausente;
    END IF;
END $$;

-- Trava a regra da mesma esfera: se algum par divergir, a migration inteira aborta.
DO $$
DECLARE divergente TEXT;
BEGIN
    SELECT string_agg(format('%s (%s) -> %s (%s)', m.duplicado, d.esfera, m.canonico, c.esfera), '; ')
    INTO divergente
    FROM mapa_fusao m
    JOIN public.orgaos_concedentes d ON d.nome = m.duplicado
    JOIN public.orgaos_concedentes c ON c.nome = m.canonico
    WHERE d.esfera <> c.esfera;

    IF divergente IS NOT NULL THEN
        RAISE EXCEPTION 'Fusão entre esferas diferentes bloqueada: %', divergente;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Recupera o padrinho que estava embutido no nome do órgão, ANTES de reapontar
--    (depois do reapontamento não dá mais para saber de qual duplicado o registro veio).
-- ---------------------------------------------------------------------------
UPDATE public.convenios c SET parlamentar_padrinho = 'Firmo Camurça'
FROM public.orgaos_concedentes o
WHERE o.id = c.orgao_concedente_id AND o.nome = 'SEC. SAUDE Firmo Camurça' AND c.parlamentar_padrinho IS NULL;

UPDATE public.convenios c SET parlamentar_padrinho = 'Danilo Forte'
FROM public.orgaos_concedentes o
WHERE o.id = c.orgao_concedente_id AND o.nome IN ('DANILO SAÚDE', 'DANILO MDA') AND c.parlamentar_padrinho IS NULL;

UPDATE public.convenios c SET parlamentar_padrinho = 'Bancada do Ceará'
FROM public.orgaos_concedentes o
WHERE o.id = c.orgao_concedente_id AND o.nome = 'FNS Bancada do Ceará' AND c.parlamentar_padrinho IS NULL;

-- ---------------------------------------------------------------------------
-- 2. Snapshot + reapontamento de todas as tabelas que referenciam órgão concedente
-- ---------------------------------------------------------------------------
INSERT INTO meta.orgaos_fundidos_0023 (tabela, registro_id, orgao_antigo_id, orgao_antigo_nome, orgao_novo_id, orgao_novo_nome)
SELECT t.tabela, t.registro_id, d.id, d.nome, c.id, c.nome
FROM mapa_fusao m
JOIN public.orgaos_concedentes d ON d.nome = m.duplicado
JOIN public.orgaos_concedentes c ON c.nome = m.canonico
JOIN LATERAL (
    SELECT 'convenios' AS tabela, id AS registro_id, orgao_concedente_id FROM public.convenios
    UNION ALL SELECT 'propostas', id, orgao_concedente_id FROM public.propostas
    UNION ALL SELECT 'cessoes_terreno', id, orgao_concedente_id FROM public.cessoes_terreno
    UNION ALL SELECT 'limites_custeio', id, orgao_concedente_id FROM public.limites_custeio
) t ON t.orgao_concedente_id = d.id;

UPDATE public.convenios r SET orgao_concedente_id = c.id
FROM mapa_fusao m
JOIN public.orgaos_concedentes d ON d.nome = m.duplicado
JOIN public.orgaos_concedentes c ON c.nome = m.canonico
WHERE r.orgao_concedente_id = d.id;

UPDATE public.propostas r SET orgao_concedente_id = c.id
FROM mapa_fusao m
JOIN public.orgaos_concedentes d ON d.nome = m.duplicado
JOIN public.orgaos_concedentes c ON c.nome = m.canonico
WHERE r.orgao_concedente_id = d.id;

UPDATE public.cessoes_terreno r SET orgao_concedente_id = c.id
FROM mapa_fusao m
JOIN public.orgaos_concedentes d ON d.nome = m.duplicado
JOIN public.orgaos_concedentes c ON c.nome = m.canonico
WHERE r.orgao_concedente_id = d.id;

UPDATE public.limites_custeio r SET orgao_concedente_id = c.id
FROM mapa_fusao m
JOIN public.orgaos_concedentes d ON d.nome = m.duplicado
JOIN public.orgaos_concedentes c ON c.nome = m.canonico
WHERE r.orgao_concedente_id = d.id;

-- usuarios_orgaos tem PK composta: o vínculo pode já existir no órgão canônico.
INSERT INTO public.usuarios_orgaos (usuario_id, orgao_concedente_id)
SELECT uo.usuario_id, c.id
FROM public.usuarios_orgaos uo
JOIN mapa_fusao m ON TRUE
JOIN public.orgaos_concedentes d ON d.nome = m.duplicado AND d.id = uo.orgao_concedente_id
JOIN public.orgaos_concedentes c ON c.nome = m.canonico
ON CONFLICT DO NOTHING;

DELETE FROM public.usuarios_orgaos uo
USING mapa_fusao m, public.orgaos_concedentes d
WHERE d.nome = m.duplicado AND uo.orgao_concedente_id = d.id;

-- ---------------------------------------------------------------------------
-- 3. Remove os duplicados, agora sem nenhuma referência
-- ---------------------------------------------------------------------------
DELETE FROM public.orgaos_concedentes o
USING mapa_fusao m
WHERE o.nome = m.duplicado;

-- ---------------------------------------------------------------------------
-- 4. Ajustes pontuais nos que sobraram
-- ---------------------------------------------------------------------------
-- "(85) 3457.3300" era telefone escrito dentro do nome: vira contato de verdade.
UPDATE public.orgaos_concedentes
SET contato = COALESCE(contato, '(85) 3457.3300')
WHERE nome = 'Agência de Desenvolvimento do Estado do Ceará (ADECE)';

-- Sobra do padrão antigo: o nome do órgão era o nome do parlamentar. O padrinho já foi
-- gravado no convênio no passo 1, então aqui fica só o órgão real.
UPDATE public.orgaos_concedentes SET nome = 'Ministério do Desenvolvimento Agrário (MDA)' WHERE nome = 'DANILO MDA';
UPDATE public.orgaos_concedentes SET nome = 'Ministério das Cidades' WHERE nome = 'Min CIDADES';

-- ---------------------------------------------------------------------------
-- 5. Verificações finais
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    orfaos INTEGER;
    esfera_divergente INTEGER;
BEGIN
    SELECT count(*) INTO orfaos FROM public.convenios c
    WHERE NOT EXISTS (SELECT 1 FROM public.orgaos_concedentes o WHERE o.id = c.orgao_concedente_id);
    IF orfaos > 0 THEN
        RAISE EXCEPTION 'Fusão deixou % convênio(s) sem órgão', orfaos;
    END IF;

    -- A esfera é recalculada pelo trigger a cada UPDATE de orgao_concedente_id; como só
    -- fundimos dentro da mesma esfera, nenhuma linha pode ter divergido.
    SELECT count(*) INTO esfera_divergente FROM public.convenios c
    JOIN public.orgaos_concedentes o ON o.id = c.orgao_concedente_id
    WHERE c.esfera IS DISTINCT FROM o.esfera;
    IF esfera_divergente > 0 THEN
        RAISE EXCEPTION 'Fusão alterou a esfera de % convênio(s)', esfera_divergente;
    END IF;
END $$;
