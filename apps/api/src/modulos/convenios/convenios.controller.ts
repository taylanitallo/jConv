import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { esquemaAtualizarConvenio, esquemaCriarConvenio } from '@jconv/compartilhado';
import { ConveniosService } from './convenios.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PapeisGuard } from '../../guardas/papeis.guard';
import { Papeis } from '../../comum/decoradores/papeis.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { validarComEsquema } from '../../comum/validar';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('convenios')
@UseGuards(AutenticacaoGuard, PapeisGuard)
export class ConveniosController {
  constructor(private readonly service: ConveniosService) {}

  @Get()
  async listar(
    @ClienteSupabase() cliente: SupabaseClient,
    @Query('esfera') esfera?: string,
    @Query('orgaoConcedenteId') orgaoConcedenteId?: string,
    @Query('statusGeral') statusGeral?: string,
    @Query('empresaContratadaId') empresaContratadaId?: string,
  ) {
    return paraCamelCase(
      await this.service.listar(cliente, { esfera, orgaoConcedenteId, statusGeral, empresaContratadaId }),
    );
  }

  @Get(':id')
  async obter(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string) {
    return paraCamelCase(await this.service.obter(cliente, id));
  }

  @Post()
  @Papeis('Administrador', 'GestorConvenios', 'Financeiro')
  async criar(@ClienteSupabase() cliente: SupabaseClient, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaCriarConvenio, corpo);
    return paraCamelCase(await this.service.criar(cliente, dados));
  }

  @Patch(':id')
  @Papeis('Administrador', 'GestorConvenios', 'Financeiro')
  async atualizar(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaAtualizarConvenio, corpo);
    return paraCamelCase(await this.service.atualizar(cliente, id, dados));
  }

  @Delete(':id')
  @Papeis('Administrador', 'GestorConvenios')
  async excluir(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string) {
    await this.service.excluir(cliente, id);
    return { sucesso: true };
  }
}
