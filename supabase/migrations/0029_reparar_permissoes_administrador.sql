-- Migration 0029: repara o administrador que ficou sem permissão nenhuma
--
-- A 0026 converteu usuarios.papel em linhas de permissoes_usuario, e a 0027 removeu a coluna.
-- Só que o backfill da 0026 não gerou nenhuma linha — o papel já estava vazio quando ela rodou.
-- Resultado: o único usuário do sistema ficou com 'Nenhuma' em todos os módulos, o que a RLS
-- aplica literalmente (zero convênios visíveis, nenhuma edição permitida). A trava anti-tranca
-- da 0026 não pegou porque ela procurava por papel = 'Administrador', e não havia nenhum.
--
-- O reparo é nominal de propósito. A tentação seria uma regra do tipo "usuário sem permissão
-- nenhuma vira administrador", mas isso é uma porta destrancada: todo usuário recém-criado
-- nasce sem permissões e viraria administrador sozinho.

INSERT INTO permissoes_usuario (usuario_id, modulo, nivel)
SELECT u.id, m.modulo, 'Total'::nivel_permissao
  FROM usuarios u
 CROSS JOIN (SELECT unnest(enum_range(NULL::modulo_sistema)) AS modulo) m
 WHERE u.email = 'taylan.itallo@gmail.com'
   AND u.ativo = TRUE
    ON CONFLICT (usuario_id, modulo) DO UPDATE SET nivel = EXCLUDED.nivel;

-- Confere que sobrou alguém capaz de administrar usuários: sem isso não há como conceder
-- permissão a mais ninguém pela interface, e o sistema fica sem saída.
DO $$
DECLARE
  administradores INTEGER;
BEGIN
  SELECT count(*) INTO administradores
    FROM permissoes_usuario p
    JOIN usuarios u ON u.id = p.usuario_id
   WHERE p.modulo = 'Usuarios' AND p.nivel = 'Total' AND u.ativo = TRUE;

  IF administradores = 0 THEN
    RAISE EXCEPTION 'Nenhum usuário ativo com Total em Usuarios — o sistema ficaria sem administrador';
  END IF;
END $$;
