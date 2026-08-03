#!/usr/bin/env node
// Provisionamento e manutenção dos schemas de município.
//
//   node scripts/clientes.js listar
//   node scripts/clientes.js criar <slug> "<Nome do Município>" <UF>
//   node scripts/clientes.js migrar            (aplica migrations pendentes em TODOS os clientes)
//   node scripts/clientes.js conferir <slug>   (compara o schema do cliente com o modelo)
//
// As migrations de tenant vivem em supabase/tenant/*.sql, são idempotentes e aplicadas com o
// search_path apontando para o schema do cliente — o mesmo arquivo serve para todos, que é o
// requisito de "alterar o sistema uma vez e valer para todos os municípios".
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DIR_TENANT = path.join(__dirname, '..', 'supabase', 'tenant');

// Interpolar nome de schema em DDL é inevitável (não dá para parametrizar identificador), então
// a validação acontece aqui e o CHECK da tabela clientes repete no banco.
function schemaDoSlug(slug) {
  if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug)) {
    throw new Error(`slug inválido: "${slug}" (use minúsculas, dígitos e hífen)`);
  }
  return `mun_${slug.replace(/-/g, '_')}`;
}

function migrationsTenant() {
  return fs.readdirSync(DIR_TENANT).filter((n) => n.endsWith('.sql')).sort();
}

async function conectar() {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error('SUPABASE_DB_URL não definida (veja .env.example)');
    process.exit(1);
  }
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  client.on('notice', (m) => console.log(`  NOTICE: ${m.message}`));
  await client.connect();
  return client;
}

// Aplica as migrations de tenant ainda não registradas para este schema.
async function aplicarPendentes(client, schema) {
  const { rows } = await client.query('SELECT nome_arquivo FROM meta.migracoes_tenant WHERE schema_nome = $1', [schema]);
  const aplicadas = new Set(rows.map((r) => r.nome_arquivo));
  const pendentes = migrationsTenant().filter((n) => !aplicadas.has(n));

  if (pendentes.length === 0) {
    await aplicarPrivilegios(client, schema);
    console.log(`  ${schema}: em dia`);
    return 0;
  }

  for (const arquivo of pendentes) {
    const sql = fs.readFileSync(path.join(DIR_TENANT, arquivo), 'utf8');
    await client.query('BEGIN');
    try {
      // search_path local à transação: o DDL não qualifica schema e cai aqui dentro.
      // "extensions" entra porque é onde o Supabase instala uuid-ossp/pgcrypto, e os DEFAULT
      // uuid_generate_v4() não resolvem sem ele. "public" fica de FORA de propósito: com ele no
      // caminho, um objeto faltando no município resolveria silenciosamente para a tabela
      // homônima do mestre em vez de dar erro — isso é vazamento entre clientes, não fallback.
      await client.query(`SET LOCAL search_path = "${schema}", extensions`);
      // Funções LANGUAGE sql têm o corpo validado na criação, e elas se referenciam entre si em
      // ordem que não é a alfabética do arquivo. Desligar a checagem é o que o próprio pg_dump
      // faz ao restaurar. Sem isso, a criação só passava porque encontrava a função homônima no
      // public — ou seja, o schema do município ficava amarrado ao do mestre.
      await client.query('SET LOCAL check_function_bodies = off');
      await client.query(sql);
      await client.query('INSERT INTO meta.migracoes_tenant (schema_nome, nome_arquivo) VALUES ($1, $2)', [schema, arquivo]);
      await client.query('COMMIT');
      console.log(`  ${schema}: aplicada ${arquivo}`);
    } catch (erro) {
      await client.query('ROLLBACK');
      throw new Error(`${schema} / ${arquivo}: ${erro.message}`);
    }
  }
  await aplicarPrivilegios(client, schema);
  return pendentes.length;
}

// Sem isto o papel "authenticated" (usado pela API para que a RLS valha) não enxerga o schema
// do cliente. Reaplicado a cada rodada de migrations, para cobrir tabelas criadas depois.
async function aplicarPrivilegios(client, schema) {
  await client.query(`GRANT USAGE ON SCHEMA "${schema}" TO authenticated, service_role`);
  await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "${schema}" TO authenticated, service_role`);
  await client.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "${schema}" TO authenticated, service_role`);
  await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA "${schema}" GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role`);
}

async function criar(client, slug, nome, uf) {
  const schema = schemaDoSlug(slug);
  const { rows: existe } = await client.query('SELECT 1 FROM public.clientes WHERE slug = $1', [slug]);
  if (existe.length) throw new Error(`cliente "${slug}" já cadastrado`);

  // Cadastro e schema numa transação só: se a criação do schema falhar, não fica cliente
  // registrado apontando para schema inexistente. As migrations vêm depois, cada uma na sua
  // própria transação, e são idempotentes — dá para reexecutar com "migrar".
  await client.query('BEGIN');
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    await client.query(
      'INSERT INTO public.clientes (nome_municipio, uf, slug, schema_nome) VALUES ($1, $2, $3, $4)',
      [nome, uf.toUpperCase(), slug, schema],
    );
    await client.query('COMMIT');
  } catch (erro) {
    await client.query('ROLLBACK');
    throw erro;
  }

  console.log(`cliente "${nome}/${uf}" criado (slug ${slug}, schema ${schema})`);
  await aplicarPendentes(client, schema);
}

// Remove cliente e schema. Existe para desfazer um provisionamento que falhou no meio; apagar
// cliente de verdade é decisão de negócio e passa pelo superadmin, não por aqui.
async function remover(client, slug) {
  const schema = schemaDoSlug(slug);
  await client.query('DELETE FROM public.clientes WHERE slug = $1', [slug]);
  await client.query('DELETE FROM meta.migracoes_tenant WHERE schema_nome = $1', [schema]);
  await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  console.log(`cliente "${slug}" e schema ${schema} removidos`);
}

async function listar(client) {
  const { rows } = await client.query(`
    SELECT c.slug, c.nome_municipio, c.uf, c.schema_nome, c.ativo,
           (SELECT count(*) FROM meta.migracoes_tenant m WHERE m.schema_nome = c.schema_nome) AS migrations
    FROM public.clientes c ORDER BY c.nome_municipio`);
  if (!rows.length) return console.log('nenhum cliente cadastrado');
  const total = migrationsTenant().length;
  console.table(rows.map((r) => ({ ...r, migrations: `${r.migrations}/${total}` })));
}

// Compara o schema do cliente com o public (referência) para provar que são equivalentes.
async function conferir(client, slug) {
  const schema = schemaDoSlug(slug);
  const consulta = async (sql, s) => (await client.query(sql, [s])).rows.map((r) => Object.values(r).join('.'));
  const alvos = [
    ['tabelas', 'SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY 1'],
    ['colunas', `SELECT table_name || '.' || column_name FROM information_schema.columns WHERE table_schema = $1 ORDER BY 1`],
    ['policies', 'SELECT tablename || $2 || policyname FROM pg_policies WHERE schemaname = $1 ORDER BY 1'],
    ['funcoes', `SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = $1 ORDER BY 1`],
  ];

  let divergencias = 0;
  for (const [rotulo, sql] of alvos) {
    const params = sql.includes('$2') ? [schema, '/'] : [schema];
    const doCliente = (await client.query(sql, params)).rows.map((r) => Object.values(r)[0]);
    const refParams = sql.includes('$2') ? ['public', '/'] : ['public'];
    let referencia = (await client.query(sql, refParams)).rows.map((r) => Object.values(r)[0]);

    // O mestre tem clientes (só em public) e o cliente tem eventos (auditoria por município).
    referencia = referencia.filter((v) => !String(v).startsWith('clientes'));
    const soNoCliente = doCliente.filter((v) => !referencia.includes(v) && !String(v).startsWith('eventos') && !String(v).includes('gravar_evento'));
    const soNaReferencia = referencia.filter((v) => !doCliente.includes(v));

    if (soNoCliente.length || soNaReferencia.length) {
      divergencias += soNoCliente.length + soNaReferencia.length;
      console.log(`  X ${rotulo}: ${soNaReferencia.length} faltando, ${soNoCliente.length} a mais`);
      if (soNaReferencia.length) console.log(`      faltando: ${soNaReferencia.slice(0, 8).join(', ')}`);
      if (soNoCliente.length) console.log(`      a mais:   ${soNoCliente.slice(0, 8).join(', ')}`);
    } else {
      console.log(`  OK ${rotulo}: ${doCliente.length} iguais à referência`);
    }
  }
  if (divergencias) throw new Error(`${divergencias} divergência(s) entre ${schema} e public`);
  console.log(`\n${schema} equivale ao schema de referência.`);
}

async function main() {
  const [comando, ...args] = process.argv.slice(2);
  const client = await conectar();
  try {
    if (comando === 'listar') await listar(client);
    else if (comando === 'criar') {
      const [slug, nome, uf] = args;
      if (!slug || !nome || !uf) throw new Error('uso: criar <slug> "<Nome>" <UF>');
      await criar(client, slug, nome, uf);
    } else if (comando === 'migrar') {
      const { rows } = await client.query('SELECT schema_nome FROM public.clientes ORDER BY nome_municipio');
      if (!rows.length) return console.log('nenhum cliente cadastrado');
      let total = 0;
      for (const { schema_nome } of rows) total += await aplicarPendentes(client, schema_nome);
      console.log(`\n${total} migration(s) aplicada(s) em ${rows.length} cliente(s).`);
    } else if (comando === 'remover') {
      if (!args[0]) throw new Error('uso: remover <slug>');
      await remover(client, args[0]);
    } else if (comando === 'conferir') {
      if (!args[0]) throw new Error('uso: conferir <slug>');
      await conferir(client, args[0]);
    } else {
      console.log('comandos: listar | criar <slug> "<Nome>" <UF> | migrar | conferir <slug> | remover <slug>');
      process.exitCode = 1;
    }
  } catch (erro) {
    console.error(`falhou: ${erro.message}`);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
