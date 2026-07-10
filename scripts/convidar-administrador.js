#!/usr/bin/env node
// Cria o primeiro usuário no Supabase Auth via convite por e-mail (o próprio usuário define a
// senha pelo link recebido — nunca geramos/vemos a senha aqui) e já vincula o papel
// Administrador em public.usuarios.
//
// Uso: node scripts/convidar-administrador.js <email> "<nome completo>"
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

async function main() {
  const [email, nome] = process.argv.slice(2);
  if (!email || !nome) {
    console.error('Uso: node scripts/convidar-administrador.js <email> "<nome completo>"');
    process.exit(1);
  }

  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error) {
    console.error(`Erro ao convidar usuário: ${error.message}`);
    process.exit(1);
  }

  console.log(`Convite enviado para ${email} (verifique a caixa de entrada para definir a senha).`);

  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(
    `INSERT INTO public.usuarios (id, nome, email, papel, ativo)
     VALUES ($1, $2, $3, 'Administrador', TRUE)
     ON CONFLICT (id) DO UPDATE SET papel = 'Administrador', ativo = TRUE`,
    [data.user.id, nome, email],
  );
  await client.end();

  console.log(`Vinculado como Administrador em public.usuarios (id ${data.user.id}).`);
}

main();
