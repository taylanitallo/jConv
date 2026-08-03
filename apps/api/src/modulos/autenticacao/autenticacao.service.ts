import { ForbiddenException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfiguracaoService } from '../../configuracao/configuracao.service';
import { BancoService } from '../../banco/banco.service';

export interface SessaoAutenticada {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  usuarioId: string;
  email: string;
}

export interface OrigemAcesso {
  ip?: string;
  agente?: string;
}

@Injectable()
export class AutenticacaoService {
  private readonly logger = new Logger(AutenticacaoService.name);

  constructor(
    private readonly configuracao: ConfiguracaoService,
    private readonly banco: BancoService,
  ) {}

  async entrar(email: string, senha: string, slug: string, origem: OrigemAcesso = {}): Promise<SessaoAutenticada> {
    const registrar = (sucesso: boolean, motivo: string | null, usuarioId: string | null) =>
      this.registrarAcesso({ email, slug, sucesso, motivo, usuarioId, ...origem });

    let municipio;
    try {
      municipio = await this.banco.obterClientePorSlug(slug);
    } catch (erro) {
      await registrar(false, 'município inválido ou inativo', null);
      throw erro instanceof NotFoundException ? erro : new NotFoundException('Município não encontrado');
    }

    const clienteAnonimo = createClient(this.configuracao.supabaseUrl, this.configuracao.supabaseAnonKey);
    const { data, error } = await clienteAnonimo.auth.signInWithPassword({ email, password: senha });

    if (error || !data.session || !data.user) {
      await registrar(false, 'e-mail ou senha inválidos', null);
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    // O cadastro do usuário vive no schema do município, não em public — e a conta do Supabase
    // Auth é global. Sem esta checagem, quem tem login em uma prefeitura entraria em qualquer
    // outra só trocando o slug na URL.
    const perfil = await this.banco.executarComoDono(municipio.schemaNome, async (executar) => {
      const { rows } = await executar('SELECT ativo FROM usuarios WHERE id = $1', [data.user.id]);
      return rows[0] as { ativo: boolean } | undefined;
    });

    // Nada de signOut() ao recusar. O signOut do Supabase revoga TODAS as sessões da conta, não
    // só a que acabou de nascer aqui: com vários municípios, tentar entrar por engano no
    // município errado derrubava a sessão que a pessoa já tinha aberta no município certo.
    // Os tokens desta tentativa nunca saem daqui — não viram cookie, ninguém os recebe.
    if (!perfil) {
      await registrar(false, 'sem cadastro neste município', data.user.id);
      throw new ForbiddenException(`Você não tem acesso ao município de ${municipio.nomeMunicipio}.`);
    }

    if (!perfil.ativo) {
      await registrar(false, 'usuário desativado', data.user.id);
      throw new ForbiddenException('Usuário sem acesso ao sistema. Contate um administrador.');
    }

    await registrar(true, null, data.user.id);

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      usuarioId: data.user.id,
      email: data.user.email ?? email,
    };
  }

  /** Falha ao registrar não pode impedir alguém de entrar — só vira log. */
  private async registrarAcesso(dados: {
    email: string;
    slug: string;
    sucesso: boolean;
    motivo: string | null;
    usuarioId: string | null;
    ip?: string;
    agente?: string;
  }) {
    try {
      await this.banco.consultarMestre(
        `INSERT INTO public.acessos (email, usuario_id, cliente_slug, sucesso, motivo, ip, agente)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          dados.email,
          dados.usuarioId,
          dados.slug,
          dados.sucesso,
          dados.motivo,
          dados.ip ?? null,
          dados.agente?.slice(0, 300) ?? null,
        ],
      );
    } catch (erro) {
      this.logger.warn(`não foi possível registrar o acesso: ${(erro as Error).message}`);
    }
  }
}
