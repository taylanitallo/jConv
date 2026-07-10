import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { esquemaAtualizarUsuario, esquemaCriarUsuario } from '@jconv/compartilhado';
import { UsuariosService } from './usuarios.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PapeisGuard } from '../../guardas/papeis.guard';
import { Papeis } from '../../comum/decoradores/papeis.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { validarComEsquema } from '../../comum/validar';
import { paraCamelCase } from '../../comum/mapeadores';

// Gerenciamento de Usuários — restrito ao Administrador (seção 3, item 2 do enunciado).
@Controller('usuarios')
@UseGuards(AutenticacaoGuard, PapeisGuard)
@Papeis('Administrador')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

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
    return paraCamelCase(await this.service.listarOrgaosDoUsuario(cliente, id));
  }

  @Post()
  async criar(@ClienteSupabase() cliente: SupabaseClient, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaCriarUsuario, corpo);
    return paraCamelCase(await this.service.criar(cliente, dados));
  }

  @Patch(':id')
  async atualizar(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaAtualizarUsuario, corpo);
    return paraCamelCase(await this.service.atualizar(cliente, id, dados));
  }
}
