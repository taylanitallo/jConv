import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { esquemaAtualizarAditivo, esquemaCriarAditivo } from '@jconv/compartilhado';
import { AditivosService } from './aditivos.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PermissoesGuard } from '../../guardas/permissoes.guard';
import { Permissao } from '../../comum/decoradores/permissao.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { validarComEsquema } from '../../comum/validar';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('convenios/:convenioId/aditivos')
@UseGuards(AutenticacaoGuard, PermissoesGuard)
@Permissao('Convenios', 'Parcial')
export class AditivosController {
  constructor(private readonly service: AditivosService) {}

  @Get()
  async listar(@ClienteSupabase() cliente: SupabaseClient, @Param('convenioId') convenioId: string) {
    return paraCamelCase(await this.service.listar(cliente, convenioId));
  }

  @Post()
  @Permissao('Convenios', 'Total')
  async criar(
    @ClienteSupabase() cliente: SupabaseClient,
    @Param('convenioId') convenioId: string,
    @Body() corpo: unknown,
  ) {
    const dados = validarComEsquema(esquemaCriarAditivo, { ...(corpo as object), convenioId });
    return paraCamelCase(await this.service.criar(cliente, dados));
  }

  @Patch(':id')
  @Permissao('Convenios', 'Total')
  async atualizar(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaAtualizarAditivo, corpo);
    return paraCamelCase(await this.service.atualizar(cliente, id, dados));
  }

  @Delete(':id')
  @Permissao('Convenios', 'Total')
  async excluir(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string) {
    await this.service.excluir(cliente, id);
    return { sucesso: true };
  }
}
