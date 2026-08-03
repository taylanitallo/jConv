import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN_CLIENT } from '../../configuracao/supabase.provider';
import { NOME_COOKIE_ACCESS_TOKEN } from '../../comum/constantes';
import { BancoService } from '../../banco/banco.service';

/**
 * Porta única do superadmin. Não reaproveita o AutenticacaoGuard de propósito: aquele monta uma
 * sessão dentro de um município, e aqui é o contrário — as rotas operam no schema mestre e
 * atravessam a RLS de qualquer prefeitura.
 *
 * Ser superadmin é estar em public.superadmins, uma tabela que nenhuma sessão de município
 * consegue ler (RLS ligada, zero policies): quem entra pela API normal não descobre nem quem
 * são, quanto mais se incluir na lista.
 */
@Injectable()
export class SuperadminGuard implements CanActivate {
  constructor(
    @Inject(SUPABASE_ADMIN_CLIENT) private readonly supabaseAdmin: SupabaseClient,
    private readonly banco: BancoService,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const requisicao = contexto.switchToHttp().getRequest<Request>();
    const token = requisicao.cookies?.[NOME_COOKIE_ACCESS_TOKEN];
    if (!token) throw new UnauthorizedException('Não autenticado');

    const { data, error } = await this.supabaseAdmin.auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Sessão inválida ou expirada');

    const linhas = await this.banco.consultarMestre<{ nome: string }>(
      'SELECT nome FROM public.superadmins WHERE usuario_id = $1',
      [data.user.id],
    );
    if (!linhas.length) throw new ForbiddenException('Área restrita à administração do sistema');

    requisicao.usuarioAutenticado = { id: data.user.id, email: data.user.email ?? '' };
    return true;
  }
}
