import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { esquemaAtualizarOrgaoConcedente, esquemaCriarOrgaoConcedente } from '@jconv/compartilhado';
import { OrgaosConcedentesService } from './orgaos-concedentes.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PapeisGuard } from '../../guardas/papeis.guard';
import { Papeis } from '../../comum/decoradores/papeis.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { validarComEsquema } from '../../comum/validar';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('orgaos-concedentes')
@UseGuards(AutenticacaoGuard, PapeisGuard)
export class OrgaosConcedentesController {
  constructor(private readonly service: OrgaosConcedentesService) {}

  @Get()
  async listar(@ClienteSupabase() cliente: SupabaseClient) {
    return paraCamelCase(await this.service.listar(cliente));
  }

  @Get(':id')
  async obter(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string) {
    return paraCamelCase(await this.service.obter(cliente, id));
  }

  @Post()
  @Papeis('Administrador', 'GestorConvenios')
  async criar(@ClienteSupabase() cliente: SupabaseClient, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaCriarOrgaoConcedente, corpo);
    return paraCamelCase(await this.service.criar(cliente, dados));
  }

  @Patch(':id')
  @Papeis('Administrador', 'GestorConvenios')
  async atualizar(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaAtualizarOrgaoConcedente, corpo);
    return paraCamelCase(await this.service.atualizar(cliente, id, dados));
  }

  @Delete(':id')
  @Papeis('Administrador')
  async excluir(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string) {
    await this.service.excluir(cliente, id);
    return { sucesso: true };
  }
}
