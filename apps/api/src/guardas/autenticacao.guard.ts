import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { ConfiguracaoService } from '../configuracao/configuracao.service';
import { SUPABASE_ADMIN_CLIENT } from '../configuracao/supabase.provider';
import { NOME_COOKIE_ACCESS_TOKEN } from '../comum/constantes';

// Lê o access_token do cookie HTTP-only, valida contra o Supabase Auth e monta, para o
// restante da requisição, um cliente Supabase autenticado como o próprio usuário — assim as
// consultas feitas pelos services respeitam a RLS do Postgres (nunca usamos o cliente admin
// para servir dados de negócio).
@Injectable()
export class AutenticacaoGuard implements CanActivate {
  constructor(
    private readonly configuracao: ConfiguracaoService,
    @Inject(SUPABASE_ADMIN_CLIENT) private readonly supabaseAdmin: SupabaseClient,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const requisicao = contexto.switchToHttp().getRequest<Request>();
    const token = requisicao.cookies?.[NOME_COOKIE_ACCESS_TOKEN];

    if (!token) {
      throw new UnauthorizedException('Não autenticado');
    }

    const { data, error } = await this.supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    requisicao.usuarioAutenticado = { id: data.user.id, email: data.user.email ?? '' };
    requisicao.supabaseClienteUsuario = createClient(this.configuracao.supabaseUrl, this.configuracao.supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    return true;
  }
}
