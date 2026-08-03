import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ClienteDados } from '../../banco/cliente-dados';
import { esquemaCriarObservacaoConvenio } from '@jconv/compartilhado';
import { ObservacoesService } from './observacoes.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PermissoesGuard } from '../../guardas/permissoes.guard';
import { Permissao } from '../../comum/decoradores/permissao.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { UsuarioAtual } from '../../comum/decoradores/usuario-atual.decorator';
import { validarComEsquema } from '../../comum/validar';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('convenios/:convenioId/observacoes')
@UseGuards(AutenticacaoGuard, PermissoesGuard)
@Permissao('Convenios', 'Parcial')
export class ObservacoesController {
  constructor(private readonly service: ObservacoesService) {}

  @Get()
  async listar(@ClienteSupabase() cliente: ClienteDados, @Param('convenioId') convenioId: string) {
    return paraCamelCase(await this.service.listar(cliente, convenioId));
  }

  // Sem @Patch e sem @Delete: o histórico é imutável (ver migration 0022).
  @Post()
  @Permissao('Convenios', 'Total')
  async criar(
    @ClienteSupabase() cliente: ClienteDados,
    @UsuarioAtual() usuario: { id: string; email: string },
    @Param('convenioId') convenioId: string,
    @Body() corpo: unknown,
  ) {
    const dados = validarComEsquema(esquemaCriarObservacaoConvenio, { ...(corpo as object), convenioId });
    return paraCamelCase(await this.service.criar(cliente, dados, usuario.email));
  }
}
