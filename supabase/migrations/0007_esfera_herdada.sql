-- Migration 0007: Função genérica de herança de esfera
-- Reaproveitada pelas tabelas Convenio, Proposta, CessaoTerreno e LimiteCusteio: a coluna
-- esfera nunca é digitada pelo usuário, é sempre copiada do OrgaoConcedente selecionado.

CREATE OR REPLACE FUNCTION public.herdar_esfera_orgao()
RETURNS TRIGGER AS $$
BEGIN
    SELECT esfera INTO NEW.esfera
    FROM public.orgaos_concedentes
    WHERE id = NEW.orgao_concedente_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.herdar_esfera_orgao IS 'Copia esfera do OrgaoConcedente para a linha (Convenio/Proposta/CessaoTerreno/LimiteCusteio) antes de INSERT/UPDATE de orgao_concedente_id';
