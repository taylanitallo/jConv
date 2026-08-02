-- Migration 0027: remove o papel, substituído pelas permissões por módulo (migration 0026)
--
-- APLICAR SOMENTE DEPOIS DO DEPLOY do código que deixou de ler usuarios.papel (PapeisGuard e
-- formulário de usuário). Rodar antes derruba o login e o cadastro de usuários na versão
-- publicada, porque o guard consulta essa coluna a cada requisição.

ALTER TABLE public.usuarios DROP COLUMN IF EXISTS papel;

-- O comentário da 0024 ainda falava em LeituraSecretario, que deixou de existir. NULL agora
-- significa "todas as secretarias" (sem recorte por órgão), e vale para qualquer usuário.
COMMENT ON COLUMN public.usuarios.secretaria_id IS 'Secretaria do usuário. NULL = todas as secretarias (enxerga todos os órgãos); preenchido = só os órgãos vinculados a ela';

DROP FUNCTION IF EXISTS public.tem_papel(public.papel_usuario[]);
DROP FUNCTION IF EXISTS public.papel_usuario_atual();

DROP TYPE IF EXISTS public.papel_usuario;
