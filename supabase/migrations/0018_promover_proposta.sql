-- Migration 0018: rotina de promoção de Proposta aprovada para Convenio
--
-- SECURITY INVOKER (padrão): roda com o papel do usuário chamador, então toda a RLS de
-- propostas/convenios continua valendo (só quem tem papel e acesso ao órgão consegue promover).
-- Atômico: se qualquer parte falhar, nada é gravado (function inteira roda numa transação implícita).

CREATE OR REPLACE FUNCTION public.promover_proposta_para_convenio(
    p_proposta_id UUID,
    p_tipo_instrumento public.tipo_instrumento,
    p_valor_conveniado NUMERIC DEFAULT NULL,
    p_valor_concedido NUMERIC DEFAULT NULL,
    p_valor_contrapartida NUMERIC DEFAULT NULL,
    p_numero_convenio TEXT DEFAULT NULL,
    p_numero_mapp TEXT DEFAULT NULL,
    p_numero_sic TEXT DEFAULT NULL,
    p_data_assinatura DATE DEFAULT NULL,
    p_data_inicio_vigencia DATE DEFAULT NULL,
    p_data_fim_vigencia DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_proposta RECORD;
    v_convenio_id UUID;
BEGIN
    SELECT * INTO v_proposta FROM public.propostas WHERE id = p_proposta_id;

    IF v_proposta IS NULL THEN
        RAISE EXCEPTION 'Proposta não encontrada ou sem acesso';
    END IF;

    IF v_proposta.convenio_gerado_id IS NOT NULL THEN
        RAISE EXCEPTION 'Esta proposta já foi promovida a convênio';
    END IF;

    INSERT INTO public.convenios (
        orgao_concedente_id, tipo_instrumento, objeto, valor_conveniado, valor_concedido,
        valor_contrapartida, numero_convenio, numero_mapp, numero_sic, numero_protocolo,
        numero_nup, data_assinatura, data_inicio_vigencia, data_fim_vigencia, observacoes
    ) VALUES (
        v_proposta.orgao_concedente_id, p_tipo_instrumento, v_proposta.objeto, p_valor_conveniado,
        p_valor_concedido, p_valor_contrapartida, p_numero_convenio, p_numero_mapp, p_numero_sic,
        v_proposta.numero_protocolo, v_proposta.numero_nup, p_data_assinatura, p_data_inicio_vigencia,
        p_data_fim_vigencia, v_proposta.observacoes
    ) RETURNING id INTO v_convenio_id;

    UPDATE public.propostas SET status = 'Aprovada', convenio_gerado_id = v_convenio_id WHERE id = p_proposta_id;

    RETURN v_convenio_id;
END;
$$;

COMMENT ON FUNCTION public.promover_proposta_para_convenio IS 'Promove uma Proposta aprovada a Convenio, copiando os campos comuns e preservando a proposta original como histórico';

GRANT EXECUTE ON FUNCTION public.promover_proposta_para_convenio TO authenticated;
