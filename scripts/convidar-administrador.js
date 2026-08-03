#!/usr/bin/env node
// Cria o primeiro administrador de um município: convida por e-mail no Supabase Auth (o próprio
// usuário define a senha pelo link recebido — nunca geramos/vemos a senha aqui) e grava o perfil
// com permissão Total em todos os módulos, dentro do schema daquele município.
//
// A conta do Auth é global, mas o perfil não: o mesmo e-mail pode administrar mais de uma
// prefeitura, e é o cadastro no schema que define onde ele entra.
//
// Uso: node scripts/convidar-administrador.js <slug> <email> "<nome completo>"
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

async function main() {
  const [slug, email, nome] = process.argv.slice(2);
  if (!slug || !email || !nome) {
    console.error('Uso: node scripts/convidar-administrador.js <slug> <email> "<nome completo>"');
    process.exit(1);
  }

  const cliente = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });
  await cliente.connect();

  try {
    const { rows } = await cliente.query(
      'SELECT schema_nome, nome_municipio FROM public.clientes WHERE slug = $1 AND ativo = TRUE',
      [slug],
    );
    if (!rows.length) {
      throw new Error(`Município "${slug}" não encontrado ou inativo. Veja: node scripts/clientes.js listar`);
    }
    const { schema_nome: schema, nome_municipio: nomeMunicipio } = rows[0];

    const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const urlFrontend = process.env.URL_FRONTEND || 'https://jconv-web.vercel.app';
    // O link cai na página do município, e não numa raiz genérica: é de lá que ele vai entrar.
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${urlFrontend}/${slug}/definir-senha`,
    });

    // Convite repetido para quem já tem conta não é erro aqui: o objetivo é garantir o perfil e
    // as permissões no município, e a conta do Auth pode já existir de outra prefeitura.
    let usuarioId = data?.user?.id;
    if (error) {
      const { data: existente } = await admin.auth.admin.listUsers();
      usuarioId = existente?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
      if (!usuarioId) {
        throw new Error(`Erro ao convidar usuário: ${error.message}`);
      }
      console.log(`Usuário já existia no Supabase Auth — seguindo para vincular em ${slug}.`);
    } else {
      console.log(`Convite enviado para ${email} (a senha é definida pelo link recebido).`);
    }

    await cliente.query('BEGIN');
    await cliente.query(`SET LOCAL search_path = "${schema}", extensions`);

    await cliente.query(
      `INSERT INTO usuarios (id, nome, email, ativo)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, ativo = TRUE`,
      [usuarioId, nome, email],
    );

    await cliente.query(
      `INSERT INTO permissoes_usuario (usuario_id, modulo, nivel)
       SELECT $1, m.modulo, 'Total'::nivel_permissao
         FROM (SELECT unnest(enum_range(NULL::modulo_sistema)) AS modulo) m
          ON CONFLICT (usuario_id, modulo) DO UPDATE SET nivel = 'Total'`,
      [usuarioId],
    );

    await cliente.query('COMMIT');

    console.log(`${nome} é administrador de ${nomeMunicipio} (${schema}), com acesso Total a todos os módulos.`);
    console.log(`Entrada do sistema: ${urlFrontend}/${slug}`);
  } catch (erro) {
    await cliente.query('ROLLBACK').catch(() => undefined);
    console.error(erro.message);
    process.exitCode = 1;
  } finally {
    await cliente.end();
  }
}

main();
