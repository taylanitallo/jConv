import { Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { esquemaLogin } from '@jconv/compartilhado';
import { validarComEsquema } from '../../comum/validar';
import { ConfiguracaoService } from '../../configuracao/configuracao.service';
import { NOME_COOKIE_ACCESS_TOKEN, NOME_COOKIE_REFRESH_TOKEN } from '../../comum/constantes';
import { BancoService } from '../../banco/banco.service';
import { SuperadminGuard } from './superadmin.guard';
import { UsuarioAtual } from '../../comum/decoradores/usuario-atual.decorator';

/**
 * Entrada própria da administração do sistema.
 *
 * Fica num controller separado porque é a única rota de /superadmin que NÃO pode passar pelo
 * SuperadminGuard — é ela que estabelece a sessão. E existe porque a administração não pertence
 * a município nenhum: exigir que o dono do sistema entrasse por uma prefeitura para depois
 * administrar as outras invertia a relação.
 *
 * O cookie é o mesmo do resto do sistema. Quem é superadmin e também tem cadastro num município
 * entra uma vez e circula entre os dois; quem só administra nunca precisa de um município.
 */
@Controller('superadmin')
export class SuperadminAutenticacaoController {
  constructor(
    private readonly configuracao: ConfiguracaoService,
    private readonly banco: BancoService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async entrar(@Body() corpo: unknown, @Req() requisicao: Request, @Res({ passthrough: true }) resposta: Response) {
    const { email, senha } = validarComEsquema(esquemaLogin, corpo);
    const ip = (requisicao.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? requisicao.ip;
    const agente = requisicao.headers['user-agent'];

    const clienteAnonimo = createClient(this.configuracao.supabaseUrl, this.configuracao.supabaseAnonKey);
    const { data, error } = await clienteAnonimo.auth.signInWithPassword({ email, password: senha });

    if (error || !data.session || !data.user) {
      await this.registrar({ email, sucesso: false, motivo: 'e-mail ou senha inválidos', usuarioId: null, ip, agente });
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const cadastro = await this.banco.consultarMestre<{ nome: string }>(
      'SELECT nome FROM public.superadmins WHERE usuario_id = $1',
      [data.user.id],
    );

    if (!cadastro.length) {
      // Sem signOut: ele revogaria todas as sessões da conta, inclusive a que a pessoa tenha
      // aberta num município. Os tokens desta tentativa não saem daqui.
      await this.registrar({ email, sucesso: false, motivo: 'não é administrador do sistema', usuarioId: data.user.id, ip, agente });
      throw new UnauthorizedException('Esta conta não administra o sistema.');
    }

    const opcoesCookie = {
      httpOnly: true,
      secure: this.configuracao.ambienteProducao,
      sameSite: (this.configuracao.ambienteProducao ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
    };
    resposta.cookie(NOME_COOKIE_ACCESS_TOKEN, data.session.access_token, {
      ...opcoesCookie,
      maxAge: data.session.expires_in * 1000,
    });
    resposta.cookie(NOME_COOKIE_REFRESH_TOKEN, data.session.refresh_token, opcoesCookie);

    await this.registrar({ email, sucesso: true, motivo: null, usuarioId: data.user.id, ip, agente });

    return { usuario: { id: data.user.id, email: data.user.email ?? email, nome: cadastro[0].nome } };
  }

  @Post('logout')
  @HttpCode(200)
  sair(@Res({ passthrough: true }) resposta: Response) {
    resposta.clearCookie(NOME_COOKIE_ACCESS_TOKEN, { path: '/' });
    resposta.clearCookie(NOME_COOKIE_REFRESH_TOKEN, { path: '/' });
    return { sucesso: true };
  }

  /** Usado pela tela para saber se já há sessão antes de pedir login de novo. */
  @Get('eu')
  @UseGuards(SuperadminGuard)
  eu(@UsuarioAtual() usuario: { id: string; email: string }) {
    return { usuario };
  }

  /** cliente_slug nulo marca no relatório os acessos que são à administração, não a um município. */
  private async registrar(dados: {
    email: string;
    sucesso: boolean;
    motivo: string | null;
    usuarioId: string | null;
    ip?: string;
    agente?: string;
  }) {
    try {
      await this.banco.consultarMestre(
        `INSERT INTO public.acessos (email, usuario_id, cliente_slug, sucesso, motivo, ip, agente)
         VALUES ($1, $2, NULL, $3, $4, $5, $6)`,
        [dados.email, dados.usuarioId, dados.sucesso, dados.motivo, dados.ip ?? null, dados.agente?.slice(0, 300) ?? null],
      );
    } catch {
      // Registrar acesso nunca pode impedir alguém de entrar.
    }
  }
}
