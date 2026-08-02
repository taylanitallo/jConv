-- Migration 0025: remove usuarios_orgaos, substituída por secretarias_orgaos (migration 0024)
--
-- APLICAR SOMENTE DEPOIS DO DEPLOY do código que deixou de usar esta tabela
-- (UsuariosService.sincronizarOrgaos / listarOrgaosDoUsuario). Rodar antes derruba o
-- cadastro de usuários na versão publicada.

DROP TABLE IF EXISTS public.usuarios_orgaos;
