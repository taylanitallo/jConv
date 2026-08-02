-- Seed inicial do jConv (idempotente — pode rodar mais de uma vez sem duplicar dados)
-- Uso: psql "$SUPABASE_DB_URL" -f scripts/seed.sql

-- Órgãos concedentes mais comuns identificados na planilha atual (ajustar/completar conforme
-- a migração real dos dados na Fase 2 — isto é só massa mínima para começar a usar o sistema).
INSERT INTO public.orgaos_concedentes (nome, esfera) VALUES
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

-- Bootstrap do primeiro Administrador:
-- Rode `node scripts/convidar-administrador.js <email> "<nome completo>"` — ele convida o
-- usuário via Supabase Auth (o próprio define a senha pelo link recebido, nunca geramos/vemos
-- a senha aqui) e já vincula o papel Administrador em public.usuarios. Não dá para fazer isso em
-- SQL puro porque o id de public.usuarios depende do id gerado pelo Supabase Auth em auth.users.
