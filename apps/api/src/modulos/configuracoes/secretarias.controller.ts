import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { esquemaAtualizarSecretaria, esquemaCriarSecretaria } from '@jconv/compartilhado';
import { SecretariasService } from './secretarias.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PapeisGuard } from '../../guardas/papeis.guard';
import { Papeis } from '../../comum/decoradores/papeis.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { validarComEsquema } from '../../comum/validar';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('secretarias')
@UseGuards(AutenticacaoGuard, PapeisGuard)
export class SecretariasController {
  constructor(private readonly service: SecretariasService) {}

  @Get()
  async listar(@ClienteSupabase() cliente: SupabaseClient) {
    return paraCamelCase(await this.service.listar(cliente));
  }

  @Get(':id')
  async obter(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string) {
    return paraCamelCase(await this.service.obter(cliente, id));
  }

  @Get(':id/orgaos')
  async listarOrgaos(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string) {
    return paraCamelCase(await this.service.listarOrgaos(cliente, id));
  }

  @Post()
  @Papeis('Administrador')
  async criar(@ClienteSupabase() cliente: SupabaseClient, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaCriarSecretaria, corpo);
    return paraCamelCase(await this.service.criar(cliente, dados));
  }

  @Patch(':id')
  @Papeis('Administrador')
  async atualizar(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaAtualizarSecretaria, corpo);
    return paraCamelCase(await this.service.atualizar(cliente, id, dados));
  }

  @Delete(':id')
  @Papeis('Administrador')
  async excluir(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string) {
    await this.service.excluir(cliente, id);
    return { sucesso: true };
  }
}
