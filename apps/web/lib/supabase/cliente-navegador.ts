import { createClient } from '@supabase/supabase-js';

// Cliente Supabase do navegador, usado só para recursos que exigem client-side (Supabase
// Realtime do Dashboard, na Fase 4). A autenticação de dados de negócio passa pela API NestJS
// (cookie HTTP-only) — este cliente com a anon key não deve ser usado para ler tabelas
// protegidas por RLS de usuário específico sem antes trocar por um token de sessão via API.
export function criarClienteSupabaseNavegador() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  );
}
