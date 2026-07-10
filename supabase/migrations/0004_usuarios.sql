-- Migration 0004: Usuario e vínculo Usuario ↔ OrgaoConcedente (escopo do perfil LeituraSecretario)

CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    papel public.papel_usuario NOT NULL DEFAULT 'LeituraSecretario',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.usuarios IS 'Usuario — perfil de acesso vinculado ao Supabase Auth. Desativar nunca apaga o histórico de ações (ver auditoria.eventos)';

CREATE UNIQUE INDEX idx_usuarios_email ON public.usuarios (LOWER(email));

CREATE TRIGGER trg_atualizado_em_usuarios
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();

-- UsuarioOrgao: vínculo N:N usado para restringir o perfil LeituraSecretario
-- a somente os convênios/propostas/cessões dos órgãos concedentes de sua secretaria.
-- Demais perfis (Administrador, GestorConvenios, Financeiro) enxergam todos os órgãos.
CREATE TABLE public.usuarios_orgaos (
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    orgao_concedente_id UUID NOT NULL REFERENCES public.orgaos_concedentes(id) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (usuario_id, orgao_concedente_id)
);

COMMENT ON TABLE public.usuarios_orgaos IS 'UsuarioOrgao — vínculo N:N que restringe o perfil LeituraSecretario aos órgãos concedentes de sua secretaria';

CREATE TRIGGER trg_audit_usuarios
    AFTER INSERT OR UPDATE OR DELETE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION auditoria.gravar_evento();

CREATE TRIGGER trg_audit_usuarios_orgaos
    AFTER INSERT OR UPDATE OR DELETE ON public.usuarios_orgaos
    FOR EACH ROW EXECUTE FUNCTION auditoria.gravar_evento();
