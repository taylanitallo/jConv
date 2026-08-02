import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  esquemaAtualizarProposta,
  esquemaCriarProposta,
  esquemaPromoverPropostaParaConvenio,
} from '@jconv/compartilhado';
import { PropostasService } from './propostas.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PermissoesGuard } from '../../guardas/permissoes.guard';
import { Permissao } from '../../comum/decoradores/permissao.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { validarComEsquema } from '../../comum/validar';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('propostas')
@UseGuards(AutenticacaoGuard, PermissoesGuard)
@Permissao('Propostas', 'Parcial')
export class PropostasController {
  constructor(private readonly service: PropostasService) {}

  @Get()
  async listar(@ClienteSupabase() cliente: SupabaseClient) {
    return paraCamelCase(await this.service.listar(cliente));
  }

  @Get(':id')
  async obter(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string) {
    return paraCamelCase(await this.service.obter(cliente, id));
  }

  @Post()
  @Permissao('Propostas', 'Total')
  async criar(@ClienteSupabase() cliente: SupabaseClient, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaCriarProposta, corpo);
    return paraCamelCase(await this.service.criar(cliente, dados));
  }

  @Patch(':id')
  @Permissao('Propostas', 'Total')
  async atualizar(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaAtualizarProposta, corpo);
    return paraCamelCase(await this.service.atualizar(cliente, id, dados));
  }

  @Delete(':id')
  @Permissao('Propostas', 'Total')
  async excluir(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string) {
    await this.service.excluir(cliente, id);
    return { sucesso: true };
  }

  @Post(':id/promover')
  @Permissao('Propostas', 'Total')
  async promover(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaPromoverPropostaParaConvenio, corpo);
    return paraCamelCase(await this.service.promover(cliente, id, dados));
  }
}
