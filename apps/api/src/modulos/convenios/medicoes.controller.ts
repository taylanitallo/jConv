import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { esquemaAtualizarMedicao, esquemaCriarMedicao } from '@jconv/compartilhado';
import { MedicoesService } from './medicoes.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PermissoesGuard } from '../../guardas/permissoes.guard';
import { Permissao } from '../../comum/decoradores/permissao.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { validarComEsquema } from '../../comum/validar';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('convenios/:convenioId/medicoes')
@UseGuards(AutenticacaoGuard, PermissoesGuard)
@Permissao('Convenios', 'Parcial')
export class MedicoesController {
  constructor(private readonly service: MedicoesService) {}

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
    const dados = validarComEsquema(esquemaCriarMedicao, { ...(corpo as object), convenioId });
    return paraCamelCase(await this.service.criar(cliente, dados));
  }

  @Patch(':id')
  @Permissao('Convenios', 'Total')
  async atualizar(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaAtualizarMedicao, corpo);
    return paraCamelCase(await this.service.atualizar(cliente, id, dados));
  }

  @Delete(':id')
  @Permissao('Convenios', 'Total')
  async excluir(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string) {
    await this.service.excluir(cliente, id);
    return { sucesso: true };
  }
}
