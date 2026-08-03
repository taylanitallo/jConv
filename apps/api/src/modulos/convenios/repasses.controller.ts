import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ClienteDados } from '../../banco/cliente-dados';
import { esquemaAtualizarRepasse, esquemaCriarRepasse } from '@jconv/compartilhado';
import { RepassesService } from './repasses.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PermissoesGuard } from '../../guardas/permissoes.guard';
import { Permissao } from '../../comum/decoradores/permissao.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { validarComEsquema } from '../../comum/validar';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('convenios/:convenioId/repasses')
@UseGuards(AutenticacaoGuard, PermissoesGuard)
@Permissao('Convenios', 'Parcial')
export class RepassesController {
  constructor(private readonly service: RepassesService) {}

  @Get()
  async listar(@ClienteSupabase() cliente: ClienteDados, @Param('convenioId') convenioId: string) {
    return paraCamelCase(await this.service.listar(cliente, convenioId));
  }

  @Post()
  @Permissao('Convenios', 'Total')
  async criar(
    @ClienteSupabase() cliente: ClienteDados,
    @Param('convenioId') convenioId: string,
    @Body() corpo: unknown,
  ) {
    const dados = validarComEsquema(esquemaCriarRepasse, { ...(corpo as object), convenioId });
    return paraCamelCase(await this.service.criar(cliente, dados));
  }

  @Patch(':id')
  @Permissao('Convenios', 'Total')
  async atualizar(@ClienteSupabase() cliente: ClienteDados, @Param('id') id: string, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaAtualizarRepasse, corpo);
    return paraCamelCase(await this.service.atualizar(cliente, id, dados));
  }

  @Delete(':id')
  @Permissao('Convenios', 'Total')
  async excluir(@ClienteSupabase() cliente: ClienteDados, @Param('id') id: string) {
    await this.service.excluir(cliente, id);
    return { sucesso: true };
  }
}
