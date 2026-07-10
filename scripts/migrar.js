#!/usr/bin/env node
// Aplica supabase/migrations/*.sql em ordem contra SUPABASE_DB_URL, pulando as já aplicadas
// (controladas por meta.migracoes_jconv). Substitui `psql` porque nem todo ambiente de
// desenvolvimento (ex. Windows sem client tools do Postgres) tem o binário disponível.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error('SUPABASE_DB_URL não definida (veja .env.example)');
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  client.on('notice', (msg) => console.log(`  NOTICE: ${msg.message}`));
  await client.connect();

  // Schema próprio (fora de public/auditoria) para não ser varrido pelo teste de cobertura de
  // RLS — esta tabela é só bookkeeping do runner, nunca acessada pela aplicação.
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS meta;
    CREATE TABLE IF NOT EXISTS meta.migracoes_jconv (
      nome_arquivo TEXT PRIMARY KEY,
      aplicado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const diretorio = path.join(__dirname, '..', 'supabase', 'migrations');
  const arquivos = fs
    .readdirSync(diretorio)
    .filter((nome) => nome.endsWith('.sql'))
    .sort();

  for (const arquivo of arquivos) {
    const { rows } = await client.query('SELECT 1 FROM meta.migracoes_jconv WHERE nome_arquivo = $1', [arquivo]);
    if (rows.length > 0) {
      console.log(`(já aplicada, pulando) ${arquivo}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(diretorio, arquivo), 'utf8');
    console.log(`aplicando ${arquivo}...`);

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO meta.migracoes_jconv (nome_arquivo) VALUES ($1)', [arquivo]);
      await client.query('COMMIT');
      console.log('  ok');
    } catch (erro) {
      await client.query('ROLLBACK');
      console.error(`  falhou: ${erro.message}`);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log('Migrations aplicadas com sucesso.');
}

main();
