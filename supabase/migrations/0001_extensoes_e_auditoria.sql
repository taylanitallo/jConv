-- Migration 0001: Extensões e auditoria genérica
-- Cria extensões necessárias, schema de auditoria e a tabela de eventos

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS auditoria;

CREATE TABLE IF NOT EXISTS auditoria.eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tabela TEXT NOT NULL,
    registro_id UUID,
    usuario_id UUID,
    acao TEXT NOT NULL CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE')),
    dados_antes JSONB,
    dados_depois JSONB,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auditoria_eventos_tabela ON auditoria.eventos(tabela);
CREATE INDEX idx_auditoria_eventos_registro ON auditoria.eventos(registro_id);
CREATE INDEX idx_auditoria_eventos_usuario ON auditoria.eventos(usuario_id);
CREATE INDEX idx_auditoria_eventos_criado_em ON auditoria.eventos(criado_em);

COMMENT ON TABLE auditoria.eventos IS 'HistoricoAlteracao: registro de auditoria de todas as alterações relevantes no sistema (quem, quando, o quê)';

-- Trigger genérica de auditoria, reaproveitada em todas as tabelas de negócio
CREATE OR REPLACE FUNCTION auditoria.gravar_evento()
RETURNS TRIGGER AS $$
DECLARE
    v_acao TEXT;
    v_dados_antes JSONB;
    v_dados_depois JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_acao := 'INSERT';
        v_dados_antes := NULL;
        v_dados_depois := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_acao := 'UPDATE';
        v_dados_antes := to_jsonb(OLD);
        v_dados_depois := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_acao := 'DELETE';
        v_dados_antes := to_jsonb(OLD);
        v_dados_depois := NULL;
    END IF;

    INSERT INTO auditoria.eventos (
        tabela, registro_id, usuario_id, acao, dados_antes, dados_depois
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE((v_dados_depois->>'id')::UUID, (v_dados_antes->>'id')::UUID),
        auth.uid(),
        v_acao,
        v_dados_antes,
        v_dados_depois
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auditoria.gravar_evento IS 'Trigger function genérica de auditoria (HistoricoAlteracao)';

-- Trigger genérica de atualizacao_em, reaproveitada em todas as tabelas de negócio
CREATE OR REPLACE FUNCTION public.atualizar_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.atualizar_atualizado_em IS 'Mantém a coluna atualizado_em sincronizada em UPDATE';
