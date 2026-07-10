#!/usr/bin/env node
// Executa um arquivo .sql avulso contra SUPABASE_DB_URL (usado para o teste de cobertura de
// RLS e para o seed). Substitui `psql`, indisponível em alguns ambientes de desenvolvimento.
require('dotenv').config();
const fs = require('fs');
const { Client } = require('pg');

async function main() {
  const arquivo = process.argv[2];
  if (!arquivo) {
    console.error('Uso: node scripts/executar-sql.js <caminho-do-arquivo.sql>');
    process.exit(1);
  }

  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error('SUPABASE_DB_URL não definida (veja .env.example)');
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  client.on('notice', (msg) => console.log(`NOTICE: ${msg.message}`));
  await client.connect();

  try {
    const sql = fs.readFileSync(arquivo, 'utf8');
    await client.query(sql);
    console.log(`Executado com sucesso: ${arquivo}`);
  } catch (erro) {
    console.error(`Falhou: ${erro.message}`);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
