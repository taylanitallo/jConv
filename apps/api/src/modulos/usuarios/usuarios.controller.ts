import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ClienteDados } from '../../banco/cliente-dados';
import { esquemaAtualizarUsuario, esquemaCriarUsuario, esquemaDefinirPermissoes } from '@jconv/compartilhado';
import { UsuariosService } from './usuarios.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PermissoesGuard } from '../../guardas/permissoes.guard';
import { Permissao } from '../../comum/decoradores/permissao.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { validarComEsquema } from '../../comum/validar';
import { paraCamelCase } from '../../comum/mapeadores';

// Gerenciamento de Usuários: listar exige Parcial no módulo Usuarios; criar, alterar e definir
// atribuições exigem Total.
@Controller('usuarios')
@UseGuards(AutenticacaoGuard, PermissoesGuard)
@Permissao('Usuarios', 'Parcial')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get()
  async listar(@ClienteSupabase() cliente: ClienteDados) {
    return paraCamelCase(await this.service.listar(cliente));
  }

  @Get(':id')
  async obter(@ClienteSupabase() cliente: ClienteDados, @Param('id') id: string) {
    return paraCamelCase(await this.service.obter(cliente, id));
  }

  // GET :id/orgaos saiu daqui: o escopo de órgãos passou a ser da Secretaria do usuário
  // (migration 0024). O equivalente agora é GET /secretarias/:id/orgaos.

  @Post()
  @Permissao('Usuarios', 'Total')
  async criar(@ClienteSupabase() cliente: ClienteDados, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaCriarUsuario, corpo);
    return paraCamelCase(await this.service.criar(cliente, dados));
  }

  @Patch(':id')
  @Permissao('Usuarios', 'Total')
  async atualizar(@ClienteSupabase() cliente: ClienteDados, @Param('id') id: string, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaAtualizarUsuario, corpo);
    return paraCamelCase(await this.service.atualizar(cliente, id, dados));
  }

  @Get(':id/permissoes')
  async listarPermissoes(@ClienteSupabase() cliente: ClienteDados, @Param('id') id: string) {
    return paraCamelCase(await this.service.listarPermissoes(cliente, id));
  }

  @Put(':id/permissoes')
  @Permissao('Usuarios', 'Total')
  async definirPermissoes(
    @ClienteSupabase() cliente: ClienteDados,
    @Param('id') id: string,
    @Body() corpo: unknown,
  ) {
    const dados = validarComEsquema(esquemaDefinirPermissoes, corpo);
    return paraCamelCase(await this.service.definirPermissoes(cliente, id, dados));
  }
}
