#!/usr/bin/env node
/**
 * Copia os dados de negócio que estão em `public` para o schema de um município.
 *
 * Só é preciso uma vez, na virada para multi-tenant: o sistema nasceu com uma prefeitura só,
 * com tudo em `public`, e esses registros precisam virar os do primeiro tenant.
 *
 * Cuidados que o script toma:
 *  - roda tudo numa transação e só confirma no fim;
 *  - recusa a cópia se o destino já tiver linhas, para não duplicar numa segunda execução;
 *  - desliga triggers durante a carga (session_replication_role), senão os triggers de auditoria
 *    e as colunas derivadas recalculariam em cima de dados que já vêm prontos, e a ordem das
 *    tabelas teria de respeitar as FKs à risca;
 *  - confere a contagem de cada tabela no fim e desfaz tudo se alguma divergir.
 *
 * Nada é apagado de `public` — a limpeza é um passo separado, depois de o sistema rodar em cima
 * do schema novo.
 *
 * Uso: node scripts/copiar-para-tenant.js <slug> [--aplicar]
 * Sem --aplicar é simulação: executa a cópia inteira e desfaz no fim (ROLLBACK).
 */
require('dotenv').config();
const { Client } = require('pg');

const URL_BANCO = process.env.SUPABASE_DB_URL;

// Ordem de dependência: pai antes de filho. Com os triggers desligados a FK não é verificada,
// mas manter a ordem deixa o resultado correto mesmo se alguém rodar sem esse recurso.
const TABELAS = [
  'configuracoes',
  'secretarias',
  'orgaos_concedentes',
  'secretarias_orgaos',
  'empresas_contratadas',
  'usuarios',
  'permissoes_usuario',
  'convenios',
  'observacoes_convenio',
  'aditivos',
  'medicoes',
  'repasses',
  'propostas',
  'cessoes_terreno',
  'limites_custeio',
  'documentos_anexos',
  'alertas',
];

function schemaDoSlug(slug) {
  if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug)) throw new Error(`slug inválido: ${slug}`);
  return `mun_${slug.replace(/-/g, '_')}`;
}

async function colunasComuns(cliente, schema, tabela) {
  const { rows } = await cliente.query(
    `SELECT a.attname,
            t.typtype,
            t.typname,
            a.attidentity,
            (SELECT count(*) FROM pg_attribute e
              WHERE e.attrelid = a.attrelid AND e.attnum > 0) AS ignorar
       FROM pg_attribute a
       JOIN pg_type t ON t.oid = a.atttypid
      WHERE a.attrelid = to_regclass($1)
        AND a.attnum > 0
        AND NOT a.attisdropped
        AND a.attgenerated = ''
      ORDER BY a.attnum`,
    [`"${schema}"."${tabela}"`],
  );
  return rows.map((r) => ({
    nome: r.attname,
    enumerado: r.typtype === 'e',
    tipo: r.typname,
    identidade: r.attidentity === 'a',
  }));
}

async function principal() {
  const [slug, ...resto] = process.argv.slice(2);
  const aplicar = resto.includes('--aplicar');
  if (!slug) {
    console.error('uso: node scripts/copiar-para-tenant.js <slug> [--aplicar]');
    process.exit(1);
  }
  if (!URL_BANCO) throw new Error('SUPABASE_DB_URL não definida');

  const schema = schemaDoSlug(slug);
  const cliente = new Client({ connectionString: URL_BANCO, ssl: { rejectUnauthorized: false } });
  await cliente.connect();

  console.log(`${aplicar ? 'APLICANDO' : 'SIMULANDO'} cópia public -> ${schema}\n`);

  try {
    await cliente.query('BEGIN');
    await cliente.query("SET LOCAL session_replication_role = 'replica'");

    const existentes = [];
    for (const tabela of TABELAS) {
      const { rows } = await cliente.query(`SELECT count(*)::int AS n FROM "${schema}"."${tabela}"`);
      if (rows[0].n > 0) existentes.push(`${tabela} (${rows[0].n})`);
    }
    if (existentes.length) {
      throw new Error(
        `destino já tem dados, cópia abortada para não duplicar: ${existentes.join(', ')}`,
      );
    }

    const resumo = [];
    for (const tabela of TABELAS) {
      // A união das colunas dos dois lados evita quebrar se um schema estiver uma migration à
      // frente do outro: copia o que existe nos dois.
      const origem = await colunasComuns(cliente, 'public', tabela);
      const destino = await colunasComuns(cliente, schema, tabela);
      const nomesDestino = new Set(destino.map((c) => c.nome));
      const colunas = origem.filter((c) => nomesDestino.has(c.nome));
      if (!colunas.length) throw new Error(`nenhuma coluna em comum para ${tabela}`);

      const lista = colunas.map((c) => `"${c.nome}"`).join(', ');
      // Cada schema tem a sua cópia dos tipos enum, e o Postgres os trata como tipos distintos
      // mesmo com o mesmo nome e os mesmos rótulos. O texto é a ponte entre os dois.
      const selecao = colunas
        .map((c) => (c.enumerado ? `"${c.nome}"::text::"${schema}"."${c.tipo}"` : `"${c.nome}"`))
        .join(', ');
      // GENERATED ALWAYS AS IDENTITY recusa valor vindo de fora, mas o numero_sequencial do
      // convênio é o número que a prefeitura enxerga — tem de vir junto, não ser regerado.
      const comIdentidade = colunas.filter((c) => c.identidade);
      const sobrepor = comIdentidade.length ? ' OVERRIDING SYSTEM VALUE' : '';
      const { rowCount } = await cliente.query(
        `INSERT INTO "${schema}"."${tabela}" (${lista})${sobrepor} SELECT ${selecao} FROM public."${tabela}"`,
      );

      // A sequência não anda sozinha quando o valor vem explícito: sem reposicionar, o próximo
      // convênio cadastrado colidiria com um número já usado.
      for (const coluna of comIdentidade) {
        await cliente.query(
          `SELECT setval(
             pg_get_serial_sequence($1, $2),
             COALESCE((SELECT max("${coluna.nome}") FROM "${schema}"."${tabela}"), 0) + 1,
             false)`,
          [`"${schema}"."${tabela}"`, coluna.nome],
        );
      }

      const { rows: conferencia } = await cliente.query(
        `SELECT (SELECT count(*) FROM public."${tabela}") AS origem,
                (SELECT count(*) FROM "${schema}"."${tabela}") AS destino`,
      );
      const { origem: nOrigem, destino: nDestino } = conferencia[0];
      if (nOrigem !== nDestino) {
        throw new Error(`${tabela}: origem tem ${nOrigem} linhas, destino ficou com ${nDestino}`);
      }

      resumo.push({ tabela, linhas: rowCount, colunas: colunas.length });
    }

    console.table(resumo);

    if (aplicar) {
      await cliente.query('COMMIT');
      console.log('\nOK  dados copiados. Nada foi removido de public.');
    } else {
      await cliente.query('ROLLBACK');
      console.log('\nSimulação concluída (ROLLBACK). Rode com --aplicar para gravar.');
    }
  } catch (erro) {
    await cliente.query('ROLLBACK').catch(() => undefined);
    console.error(`\nFALHOU: ${erro.message}`);
    process.exitCode = 1;
  } finally {
    await cliente.end();
  }
}

principal();
