-- Migration 0015: RLS do schema de auditoria
-- Escrita ocorre apenas via auditoria.gravar_evento() (SECURITY DEFINER, dono da tabela,
-- portanto não sujeita a RLS); leitura do histórico é restrita ao Administrador.

ALTER TABLE auditoria.eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY eventos_select ON auditoria.eventos
    FOR SELECT USING (public.tem_papel(ARRAY['Administrador']::public.papel_usuario[]));
