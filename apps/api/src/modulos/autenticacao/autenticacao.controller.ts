import { BadRequestException, Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ClienteDados } from '../../banco/cliente-dados';
import {
  esquemaLogin,
  type MapaPermissoes,
  type ModuloSistema,
  type NivelPermissao,
} from '@jconv/compartilhado';
import { AutenticacaoService } from './autenticacao.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { UsuarioAtual } from '../../comum/decoradores/usuario-atual.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { validarComEsquema } from '../../comum/validar';
import { ConfiguracaoService } from '../../configuracao/configuracao.service';
import { NOME_COOKIE_ACCESS_TOKEN, NOME_COOKIE_REFRESH_TOKEN } from '../../comum/constantes';
import { BancoService } from '../../banco/banco.service';

@Controller('auth')
export class AutenticacaoController {
  constructor(
    private readonly autenticacaoService: AutenticacaoService,
    private readonly configuracao: ConfiguracaoService,
    private readonly banco: BancoService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async entrar(
    @Body() corpo: unknown,
    @Req() requisicao: Request,
    @Res({ passthrough: true }) resposta: Response,
  ) {
    const { email, senha } = validarComEsquema(esquemaLogin, corpo);

    // O login é a única rota autenticada fora do TenantMiddleware — ainda não há sessão para
    // abrir — então o slug é lido aqui mesmo.
    const cabecalho = requisicao.headers['x-municipio'];
    const slug = (Array.isArray(cabecalho) ? cabecalho[0] : cabecalho)?.trim().toLowerCase();
    if (!slug) throw new BadRequestException('Município não informado na requisição');

    const sessao = await this.autenticacaoService.entrar(email, senha, slug, {
      // Atrás do proxy da Vercel/Railway o IP real vem no X-Forwarded-For; req.ip seria o do proxy.
      ip: (requisicao.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? requisicao.ip,
      agente: requisicao.headers['user-agent'],
    });

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

  // Devolve também as permissões do usuário: é com elas que o frontend decide o que mostrar no
  // menu e quais botões de ação exibir. A barreira de verdade continua sendo a RLS.
  @Get('me')
  @UseGuards(AutenticacaoGuard)
  async eu(@UsuarioAtual() usuario: { id: string; email: string }, @ClienteSupabase() cliente: ClienteDados) {
    const { data } = await cliente
      .from('permissoes_usuario')
      .select('modulo, nivel')
      .eq('usuario_id', usuario.id);

    const permissoes: MapaPermissoes = {};
    for (const linha of data ?? []) {
      permissoes[linha.modulo as ModuloSistema] = linha.nivel as NivelPermissao;
    }

    // Consultado no schema mestre, fora da sessão do município: é lá que vive a lista, e nenhuma
    // sessão de prefeitura alcança essa tabela. Serve só para o menu decidir se mostra a entrada
    // da administração — quem barra de verdade é o SuperadminGuard em cada rota.
    const superadmin = await this.banco.consultarMestre(
      'SELECT 1 FROM public.superadmins WHERE usuario_id = $1',
      [usuario.id],
    );

    return { usuario, permissoes, superadmin: superadmin.length > 0 };
  }

  // Exposto só para o Supabase Realtime autenticar o canal do navegador (Fase 4 — Dashboard em
  // tempo real). É o mesmo access_token já usado no cookie httpOnly; consultas normais de
  // dados de negócio continuam passando pela API, nunca direto do navegador pro Supabase.
  @Get('token-realtime')
  @UseGuards(AutenticacaoGuard)
  tokenRealtime(@Req() requisicao: Request) {
    return { accessToken: requisicao.cookies[NOME_COOKIE_ACCESS_TOKEN] };
  }
}
