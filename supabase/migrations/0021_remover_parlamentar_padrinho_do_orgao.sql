-- Migration 0021: remove parlamentar/padrinho do OrgaoConcedente (fase "contract" da 0020)
--
-- APLICAR SOMENTE DEPOIS DO DEPLOY do código que deixou de gravar nesta coluna (API
-- orgaos-concedentes.service + formulário do web). Rodar antes do deploy quebra o
-- cadastro/edição de órgão na versão publicada.
--
-- Nenhum órgão tinha o campo preenchido quando a 0020 foi escrita (57 órgãos, 0 com valor),
-- então não há dado a propagar para convenios antes de remover.

ALTER TABLE public.orgaos_concedentes DROP COLUMN IF EXISTS parlamentar_padrinho;
