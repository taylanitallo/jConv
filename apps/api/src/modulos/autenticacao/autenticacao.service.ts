import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { ConfiguracaoService } from '../../configuracao/configuracao.service';
import { SUPABASE_ADMIN_CLIENT } from '../../configuracao/supabase.provider';

export interface SessaoAutenticada {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  usuarioId: string;
  email: string;
}

@Injectable()
export class AutenticacaoService {
  constructor(
    private readonly configuracao: ConfiguracaoService,
    @Inject(SUPABASE_ADMIN_CLIENT) private readonly supabaseAdmin: SupabaseClient,
  ) {}

  async entrar(email: string, senha: string): Promise<SessaoAutenticada> {
    const clienteAnonimo = createClient(this.configuracao.supabaseUrl, this.configuracao.supabaseAnonKey);

    const { data, error } = await clienteAnonimo.auth.signInWithPassword({ email, password: senha });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    // Usuario desativado (papel Administrador desativa acesso sem apagar histórico): checagem
    // via cliente admin, já que o próprio usuário desativado não teria como se auto-consultar.
    const { data: perfil, error: erroPerfil } = await this.supabaseAdmin
      .from('usuarios')
      .select('ativo')
      .eq('id', data.user.id)
      .maybeSingle();

    if (erroPerfil || !perfil || !perfil.ativo) {
      await clienteAnonimo.auth.signOut();
      throw new ForbiddenException('Usuário sem acesso ao sistema. Contate um administrador.');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      usuarioId: data.user.id,
      email: data.user.email ?? email,
    };
  }
}
