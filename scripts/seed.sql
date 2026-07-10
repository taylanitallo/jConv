-- Seed inicial do jConv (idempotente — pode rodar mais de uma vez sem duplicar dados)
-- Uso: psql "$SUPABASE_DB_URL" -f scripts/seed.sql

-- Órgãos concedentes mais comuns identificados na planilha atual (ajustar/completar conforme
-- a migração real dos dados na Fase 2 — isto é só massa mínima para começar a usar o sistema).
INSERT INTO public.orgaos_concedentes (nome, esfera, parlamentar_padrinho) VALUES
    ('Secretaria das Cidades (SEC. CIDADES)', 'Estadual', NULL),
    ('Secretaria da Saúde do Estado (SEC. SAÚDE)', 'Estadual', NULL),
    ('Secretaria da Educação (SEDUC)', 'Estadual', NULL),
    ('Secretaria da Cultura (SECULT)', 'Estadual', NULL),
    ('Agência de Desenvolvimento do Estado do Ceará (ADECE)', 'Estadual', NULL),
    ('FUNASA', 'Federal', NULL),
    ('FNDE', 'Federal', NULL),
    ('Ministério do Desenvolvimento Regional (MDR)', 'Federal', NULL),
    ('Ministério da Agricultura, Pecuária e Abastecimento (MAPA)', 'Federal', NULL),
    ('Ministério da Saúde', 'Federal', NULL),
    ('DNOCS', 'Federal', NULL),
    ('Caixa Econômica Federal', 'CaixaEconomica', NULL)
ON CONFLICT (LOWER(nome)) DO NOTHING;

-- Bootstrap do primeiro Administrador:
-- Rode `node scripts/convidar-administrador.js <email> "<nome completo>"` — ele convida o
-- usuário via Supabase Auth (o próprio define a senha pelo link recebido, nunca geramos/vemos
-- a senha aqui) e já vincula o papel Administrador em public.usuarios. Não dá para fazer isso em
-- SQL puro porque o id de public.usuarios depende do id gerado pelo Supabase Auth em auth.users.
