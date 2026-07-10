import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { esquemaAtualizarAditivo, esquemaCriarAditivo } from '@jconv/compartilhado';
import { AditivosService } from './aditivos.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PapeisGuard } from '../../guardas/papeis.guard';
import { Papeis } from '../../comum/decoradores/papeis.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { validarComEsquema } from '../../comum/validar';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('convenios/:convenioId/aditivos')
@UseGuards(AutenticacaoGuard, PapeisGuard)
export class AditivosController {
  constructor(private readonly service: AditivosService) {}

  @Get()
  async listar(@ClienteSupabase() cliente: SupabaseClient, @Param('convenioId') convenioId: string) {
    return paraCamelCase(await this.service.listar(cliente, convenioId));
  }

  @Post()
  @Papeis('Administrador', 'GestorConvenios')
  async criar(
    @ClienteSupabase() cliente: SupabaseClient,
    @Param('convenioId') convenioId: string,
    @Body() corpo: unknown,
  ) {
    const dados = validarComEsquema(esquemaCriarAditivo, { ...(corpo as object), convenioId });
    return paraCamelCase(await this.service.criar(cliente, dados));
  }

  @Patch(':id')
  @Papeis('Administrador', 'GestorConvenios')
  async atualizar(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaAtualizarAditivo, corpo);
    return paraCamelCase(await this.service.atualizar(cliente, id, dados));
  }

  @Delete(':id')
  @Papeis('Administrador', 'GestorConvenios')
  async excluir(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string) {
    await this.service.excluir(cliente, id);
    return { sucesso: true };
  }
}
