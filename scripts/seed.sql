-- Seed inicial de um município do jConv (idempotente — pode rodar mais de uma vez sem duplicar)
--
-- Depois da virada multi-tenant não existe mais "o" banco do sistema: cada município tem o seu
-- schema, e este arquivo não qualifica os nomes de propósito — quem escolhe onde ele cai é o
-- search_path da conexão.
--
-- Uso:
--   psql "$SUPABASE_DB_URL" -c 'SET search_path = mun_SLUG, extensions' -f scripts/seed.sql
--
-- Sem definir o search_path, isto não vai a lugar nenhum útil: public só guarda o cadastro de
-- clientes e não tem mais tabela de negócio.

-- Órgãos concedentes mais comuns no Ceará — massa mínima para o município começar a usar o
-- sistema. Cada prefeitura ajusta a lista depois, em Órgãos Concedentes.
INSERT INTO orgaos_concedentes (nome, esfera) VALUES
    ('Secretaria das Cidades (SEC. CIDADES)', 'Estadual'),
    ('Secretaria da Saúde do Estado (SEC. SAÚDE)', 'Estadual'),
    ('Secretaria da Educação (SEDUC)', 'Estadual'),
    ('Secretaria da Cultura (SECULT)', 'Estadual'),
    ('Agência de Desenvolvimento do Estado do Ceará (ADECE)', 'Estadual'),
    ('FUNASA', 'Federal'),
    ('FNDE', 'Federal'),
    ('Ministério do Desenvolvimento Regional (MDR)', 'Federal'),
    ('Ministério da Agricultura, Pecuária e Abastecimento (MAPA)', 'Federal'),
    ('Ministério da Saúde', 'Federal'),
    ('DNOCS', 'Federal'),
    ('Caixa Econômica Federal', 'CaixaEconomica')
ON CONFLICT (LOWER(nome)) DO NOTHING;

-- Bootstrap do primeiro administrador do município:
-- Rode `node scripts/convidar-administrador.js <slug> <email> "<nome completo>"` — ele convida o
-- usuário via Supabase Auth (o próprio define a senha pelo link recebido, nunca geramos/vemos a
-- senha aqui) e grava o perfil com permissão Total no schema daquele município. Não dá para
-- fazer em SQL puro porque o id do usuário depende do id gerado pelo Supabase Auth em auth.users.
