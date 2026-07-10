import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { ConfiguracaoService } from './configuracao.service';

export const SUPABASE_ADMIN_CLIENT = 'SUPABASE_ADMIN_CLIENT';

// Cliente com a service role key: ignora RLS, usado só para operações administrativas
// (auth.getUser para validar sessão, checar usuarios.ativo no login, rotinas server-side).
// Nunca usar este cliente para responder consultas de dados de negócio do usuário — para isso,
// cada requisição autenticada ganha seu próprio cliente com o access_token do usuário
// (ver AutenticacaoGuard), garantindo que a RLS do Postgres seja sempre respeitada.
export function criarClienteSupabaseAdmin(configuracao: ConfiguracaoService): SupabaseClient {
  return createClient(configuracao.supabaseUrl, configuracao.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
