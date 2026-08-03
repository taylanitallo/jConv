import { SupabaseClient } from '@supabase/supabase-js';
import { ClienteMunicipio, SessaoTenant } from '../../banco/banco.service';

declare global {
  namespace Express {
    interface Request {
      // Preenchidos pelo AutenticacaoGuard após validar o cookie de sessão
      usuarioAutenticado?: { id: string; email: string };
      // Cliente Supabase com o access_token do usuário. Continua existindo para Auth e Storage,
      // que não são separados por schema; dados de negócio passam pela sessaoTenant.
      supabaseClienteUsuario?: SupabaseClient;
      // Município da requisição e a conexão já apontada para o schema dele, abertos pelo
      // TenantInterceptor e encerrados quando o handler termina.
      municipio?: ClienteMunicipio;
      sessaoTenant?: SessaoTenant;
    }
  }
}
