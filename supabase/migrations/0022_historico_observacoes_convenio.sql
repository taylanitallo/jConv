-- Migration 0022: Observações do convênio viram histórico imutável
--
-- Antes, convenios.observacoes era um TEXT editável: reescrever o campo apagava o que estava
-- lá. Agora cada anotação é uma linha em observacoes_convenio, com data/hora e autor, e nada
-- é apagado. convenios.observacoes continua existindo, mas passa a ser DERIVADO — guarda
-- sempre a última observação, que é a que aparece nos relatórios e listagens.

CREATE TABLE public.observacoes_convenio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    convenio_id UUID NOT NULL REFERENCES public.convenios(id) ON DELETE CASCADE,
    texto TEXT NOT NULL CHECK (btrim(texto) <> ''),
    -- Autor "fotografado" no momento do registro: o histórico não pode mudar depois, nem se o
    -- usuário for renomeado ou removido (por isso o nome fica gravado, não só a FK).
    autor_id UUID DEFAULT auth.uid() REFERENCES public.usuarios(id) ON DELETE SET NULL,
    autor_nome TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.observacoes_convenio IS 'Histórico append-only de observações de um convênio — nunca é editado nem apagado (ver trg_observacoes_convenio_imutavel)';
COMMENT ON COLUMN public.convenios.observacoes IS 'DERIVADO: última observação do histórico (observacoes_convenio). Não editar direto — inserir no histórico e deixar o trigger sincronizar';

CREATE INDEX idx_observacoes_convenio_convenio ON public.observacoes_convenio (convenio_id, criado_em DESC);

-- Imutabilidade de verdade: bloqueia UPDATE/DELETE mesmo para quem tem BYPASSRLS
-- (service role), que as políticas de RLS sozinhas não alcançariam.
CREATE OR REPLACE FUNCTION public.impedir_alteracao_observacao_convenio()
RETURNS TRIGGER AS $$
BEGIN
    -- Exceção: quando o convênio pai é excluído, o ON DELETE CASCADE precisa poder levar as
    -- filhas junto. Nesse ponto a linha do convênio já não existe mais.
    IF TG_OP = 'DELETE' AND NOT EXISTS (SELECT 1 FROM public.convenios WHERE id = OLD.convenio_id) THEN
        RETURN OLD;
    END IF;

    RAISE EXCEPTION 'O histórico de observações do convênio é imutável: não pode ser alterado nem excluído';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_observacoes_convenio_imutavel
    BEFORE UPDATE OR DELETE ON public.observacoes_convenio
    FOR EACH ROW EXECUTE FUNCTION public.impedir_alteracao_observacao_convenio();

CREATE TRIGGER trg_audit_observacoes_convenio
    AFTER INSERT OR UPDATE OR DELETE ON public.observacoes_convenio
    FOR EACH ROW EXECUTE FUNCTION auditoria.gravar_evento();

-- Mantém convenios.observacoes espelhando a última observação registrada.
CREATE OR REPLACE FUNCTION public.sincronizar_ultima_observacao_convenio()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.convenios
    SET observacoes = NEW.texto
    WHERE id = NEW.convenio_id AND observacoes IS DISTINCT FROM NEW.texto;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sincronizar_ultima_observacao
    AFTER INSERT ON public.observacoes_convenio
    FOR EACH ROW EXECUTE FUNCTION public.sincronizar_ultima_observacao_convenio();

-- Caminho inverso: convênios criados com observações já preenchidas (importação da planilha,
-- promover_proposta) entram no histórico como primeira anotação, sem depender do frontend.
CREATE OR REPLACE FUNCTION public.registrar_observacao_inicial_convenio()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.observacoes IS NOT NULL AND btrim(NEW.observacoes) <> '' THEN
        INSERT INTO public.observacoes_convenio (convenio_id, texto, criado_em)
        VALUES (NEW.id, NEW.observacoes, NEW.criado_em);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_registrar_observacao_inicial
    AFTER INSERT ON public.convenios
    FOR EACH ROW EXECUTE FUNCTION public.registrar_observacao_inicial_convenio();

-- RLS: leitura para quem enxerga o convênio; inserção para quem pode editá-lo.
-- Não existem políticas de UPDATE/DELETE de propósito — o histórico só cresce.
ALTER TABLE public.observacoes_convenio ENABLE ROW LEVEL SECURITY;

CREATE POLICY observacoes_convenio_select ON public.observacoes_convenio
    FOR SELECT USING (public.usuario_tem_acesso_convenio(convenio_id));

CREATE POLICY observacoes_convenio_insert ON public.observacoes_convenio
    FOR INSERT WITH CHECK (
        public.tem_papel(ARRAY['Administrador', 'GestorConvenios', 'Financeiro']::public.papel_usuario[])
        AND public.usuario_tem_acesso_convenio(convenio_id)
    );

-- Backfill: o texto que hoje está em convenios.observacoes vira a primeira entrada do
-- histórico, datada da criação do convênio (veio da importação da planilha).
INSERT INTO public.observacoes_convenio (convenio_id, texto, criado_em)
SELECT id, observacoes, criado_em
FROM public.convenios
WHERE observacoes IS NOT NULL AND btrim(observacoes) <> '';
