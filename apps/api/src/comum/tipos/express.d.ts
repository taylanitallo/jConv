import { SupabaseClient } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      // Preenchidos pelo AutenticacaoGuard após validar o cookie de sessão
      usuarioAutenticado?: { id: string; email: string };
      // Cliente Supabase com o access_token do usuário — todas as consultas feitas com ele
      // passam pela RLS do Postgres como o próprio usuário autenticado
      supabaseClienteUsuario?: SupabaseClient;
    }
  }
}
