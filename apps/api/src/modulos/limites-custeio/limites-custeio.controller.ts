import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { esquemaAtualizarLimiteCusteio, esquemaCriarLimiteCusteio } from '@jconv/compartilhado';
import { LimitesCusteioService } from './limites-custeio.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PermissoesGuard } from '../../guardas/permissoes.guard';
import { Permissao } from '../../comum/decoradores/permissao.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { validarComEsquema } from '../../comum/validar';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('limites-custeio')
@UseGuards(AutenticacaoGuard, PermissoesGuard)
@Permissao('LimitesCusteio', 'Parcial')
export class LimitesCusteioController {
  constructor(private readonly service: LimitesCusteioService) {}

  @Get()
  async listar(@ClienteSupabase() cliente: SupabaseClient) {
    return paraCamelCase(await this.service.listar(cliente));
  }

  @Get(':id')
  async obter(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string) {
    return paraCamelCase(await this.service.obter(cliente, id));
  }

  @Post()
  @Permissao('LimitesCusteio', 'Total')
  async criar(@ClienteSupabase() cliente: SupabaseClient, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaCriarLimiteCusteio, corpo);
    return paraCamelCase(await this.service.criar(cliente, dados));
  }

  @Patch(':id')
  @Permissao('LimitesCusteio', 'Total')
  async atualizar(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaAtualizarLimiteCusteio, corpo);
    return paraCamelCase(await this.service.atualizar(cliente, id, dados));
  }

  @Delete(':id')
  @Permissao('LimitesCusteio', 'Total')
  async excluir(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string) {
    await this.service.excluir(cliente, id);
    return { sucesso: true };
  }
}
