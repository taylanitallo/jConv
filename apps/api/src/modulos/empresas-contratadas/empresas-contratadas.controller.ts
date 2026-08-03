import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ClienteDados } from '../../banco/cliente-dados';
import { esquemaAtualizarEmpresaContratada, esquemaCriarEmpresaContratada } from '@jconv/compartilhado';
import { EmpresasContratadasService } from './empresas-contratadas.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PermissoesGuard } from '../../guardas/permissoes.guard';
import { Permissao } from '../../comum/decoradores/permissao.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { validarComEsquema } from '../../comum/validar';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('empresas-contratadas')
@UseGuards(AutenticacaoGuard, PermissoesGuard)
@Permissao('EmpresasContratadas', 'Parcial')
export class EmpresasContratadasController {
  constructor(private readonly service: EmpresasContratadasService) {}

  @Get()
  async listar(@ClienteSupabase() cliente: ClienteDados) {
    return paraCamelCase(await this.service.listar(cliente));
  }

  @Get(':id')
  async obter(@ClienteSupabase() cliente: ClienteDados, @Param('id') id: string) {
    return paraCamelCase(await this.service.obter(cliente, id));
  }

  @Post()
  @Permissao('EmpresasContratadas', 'Total')
  async criar(@ClienteSupabase() cliente: ClienteDados, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaCriarEmpresaContratada, corpo);
    return paraCamelCase(await this.service.criar(cliente, dados));
  }

  @Patch(':id')
  @Permissao('EmpresasContratadas', 'Total')
  async atualizar(@ClienteSupabase() cliente: ClienteDados, @Param('id') id: string, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaAtualizarEmpresaContratada, corpo);
    return paraCamelCase(await this.service.atualizar(cliente, id, dados));
  }

  @Delete(':id')
  @Permissao('EmpresasContratadas', 'Total')
  async excluir(@ClienteSupabase() cliente: ClienteDados, @Param('id') id: string) {
    await this.service.excluir(cliente, id);
    return { sucesso: true };
  }
}
