#!/usr/bin/env node
// Envia um e-mail de recuperação/definição de senha para um usuário já existente no Supabase
// Auth (ex.: convite antigo que confirmou a conta mas nunca chegou a definir a senha). Usa o
// mesmo destino /definir-senha do fluxo de convite.
//
// Uso: node scripts/recuperar-senha.js <email>
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const [email] = process.argv.slice(2);
  if (!email) {
    console.error('Uso: node scripts/recuperar-senha.js <email>');
    process.exit(1);
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const urlFrontend = process.env.URL_FRONTEND || 'https://jconv-web.vercel.app';
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${urlFrontend}/definir-senha`,
  });

  if (error) {
    console.error(`Erro ao enviar recuperação de senha: ${error.message}`);
    process.exit(1);
  }

  console.log(`E-mail de definição de senha enviado para ${email} (verifique a caixa de entrada).`);
}

main();
