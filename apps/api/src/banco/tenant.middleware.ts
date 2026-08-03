import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { BancoService } from './banco.service';

/**
 * Abre a conexão do município antes de qualquer guard rodar.
 *
 * Por que middleware e não interceptor: no NestJS a ordem é middleware → guards → interceptors,
 * e o PermissoesGuard precisa consultar o banco do município. Num interceptor a sessão só
 * existiria depois que o guard já tivesse rodado.
 *
 * A sessão nasce sem usuário — papel `authenticated` e nenhum claim, o que faz a RLS negar
 * tudo. Quem libera é o AutenticacaoGuard, chamando `autenticarComo()` depois de conferir o
 * cookie. Ou seja: uma rota que esqueça o guard não vaza dados, ela simplesmente não lê nada.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly banco: BancoService) {}

  async use(requisicao: Request, resposta: Response, proximo: NextFunction) {
    const slug = this.extrairSlug(requisicao);
    if (!slug) {
      throw new BadRequestException('Município não informado na requisição');
    }

    const municipio = await this.banco.obterClientePorSlug(slug);
    const sessao = await this.banco.abrirSessao(municipio.schemaNome);

    requisicao.municipio = municipio;
    requisicao.sessaoTenant = sessao;

    // A transação fecha quando a resposta termina. 'finish' é envio concluído; 'close' cobre o
    // cliente que desconectou no meio. Os dois podem disparar, daí a trava.
    let encerrada = false;
    const encerrar = (sucesso: boolean) => {
      if (encerrada) return;
      encerrada = true;
      void sessao.encerrar(sucesso);
    };

    // Erro 4xx/5xx desfaz o que a requisição tiver escrito: sem isso um handler que falha no
    // meio deixaria gravação parcial commitada.
    resposta.on('finish', () => encerrar(resposta.statusCode < 400));
    resposta.on('close', () => encerrar(false));

    proximo();
  }

  /** Cabeçalho é o caminho normal (vem do fetch do web); a query serve para teste manual. */
  private extrairSlug(requisicao: Request): string | null {
    const cabecalho = requisicao.headers['x-municipio'];
    const bruto = Array.isArray(cabecalho) ? cabecalho[0] : cabecalho ?? requisicao.query.municipio;
    if (typeof bruto !== 'string') return null;

    const slug = bruto.trim().toLowerCase();
    return /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug) ? slug : null;
  }
}
