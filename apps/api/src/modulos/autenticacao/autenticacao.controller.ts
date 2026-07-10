import { Body, Controller, Get, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { esquemaLogin } from '@jconv/compartilhado';
import { AutenticacaoService } from './autenticacao.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { UsuarioAtual } from '../../comum/decoradores/usuario-atual.decorator';
import { validarComEsquema } from '../../comum/validar';
import { ConfiguracaoService } from '../../configuracao/configuracao.service';
import { NOME_COOKIE_ACCESS_TOKEN, NOME_COOKIE_REFRESH_TOKEN } from '../../comum/constantes';

@Controller('auth')
export class AutenticacaoController {
  constructor(
    private readonly autenticacaoService: AutenticacaoService,
    private readonly configuracao: ConfiguracaoService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async entrar(@Body() corpo: unknown, @Res({ passthrough: true }) resposta: Response) {
    const { email, senha } = validarComEsquema(esquemaLogin, corpo);
    const sessao = await this.autenticacaoService.entrar(email, senha);

    // Em produção, web (Vercel) e api (Railway) ficam em domínios diferentes, então o cookie
    // precisa de SameSite=None (exige Secure=true) para ser enviado nas requisições cross-site;
    // em desenvolvimento local, Lax é suficiente e evita precisar de HTTPS local.
    const opcoesCookieBase = {
      httpOnly: true,
      secure: this.configuracao.ambienteProducao,
      sameSite: (this.configuracao.ambienteProducao ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
    };

    resposta.cookie(NOME_COOKIE_ACCESS_TOKEN, sessao.accessToken, {
      ...opcoesCookieBase,
      maxAge: sessao.expiresIn * 1000,
    });
    resposta.cookie(NOME_COOKIE_REFRESH_TOKEN, sessao.refreshToken, opcoesCookieBase);

    return { usuario: { id: sessao.usuarioId, email: sessao.email } };
  }

  @Post('logout')
  @HttpCode(200)
  sair(@Res({ passthrough: true }) resposta: Response) {
    resposta.clearCookie(NOME_COOKIE_ACCESS_TOKEN, { path: '/' });
    resposta.clearCookie(NOME_COOKIE_REFRESH_TOKEN, { path: '/' });
    return { sucesso: true };
  }

  @Get('me')
  @UseGuards(AutenticacaoGuard)
  eu(@UsuarioAtual() usuario: { id: string; email: string }) {
    return { usuario };
  }
}
