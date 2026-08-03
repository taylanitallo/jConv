import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ClienteDados } from '../../banco/cliente-dados';
import { esquemaAtualizarCessaoTerreno, esquemaCriarCessaoTerreno } from '@jconv/compartilhado';
import { CessoesTerrenoService } from './cessoes-terreno.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PermissoesGuard } from '../../guardas/permissoes.guard';
import { Permissao } from '../../comum/decoradores/permissao.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { validarComEsquema } from '../../comum/validar';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('cessoes-terreno')
@UseGuards(AutenticacaoGuard, PermissoesGuard)
@Permissao('CessoesTerreno', 'Parcial')
export class CessoesTerrenoController {
  constructor(private readonly service: CessoesTerrenoService) {}

  @Get()
  async listar(@ClienteSupabase() cliente: ClienteDados) {
    return paraCamelCase(await this.service.listar(cliente));
  }

  @Get(':id')
  async obter(@ClienteSupabase() cliente: ClienteDados, @Param('id') id: string) {
    return paraCamelCase(await this.service.obter(cliente, id));
  }

  @Post()
  @Permissao('CessoesTerreno', 'Total')
  async criar(@ClienteSupabase() cliente: ClienteDados, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaCriarCessaoTerreno, corpo);
    return paraCamelCase(await this.service.criar(cliente, dados));
  }

  @Patch(':id')
  @Permissao('CessoesTerreno', 'Total')
  async atualizar(@ClienteSupabase() cliente: ClienteDados, @Param('id') id: string, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaAtualizarCessaoTerreno, corpo);
    return paraCamelCase(await this.service.atualizar(cliente, id, dados));
  }

  @Delete(':id')
  @Permissao('CessoesTerreno', 'Total')
  async excluir(@ClienteSupabase() cliente: ClienteDados, @Param('id') id: string) {
    await this.service.excluir(cliente, id);
    return { sucesso: true };
  }
}
