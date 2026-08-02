import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { esquemaCriarObservacaoConvenio } from '@jconv/compartilhado';
import { ObservacoesService } from './observacoes.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PapeisGuard } from '../../guardas/papeis.guard';
import { Papeis } from '../../comum/decoradores/papeis.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { UsuarioAtual } from '../../comum/decoradores/usuario-atual.decorator';
import { validarComEsquema } from '../../comum/validar';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('convenios/:convenioId/observacoes')
@UseGuards(AutenticacaoGuard, PapeisGuard)
export class ObservacoesController {
  constructor(private readonly service: ObservacoesService) {}

  @Get()
  async listar(@ClienteSupabase() cliente: SupabaseClient, @Param('convenioId') convenioId: string) {
    return paraCamelCase(await this.service.listar(cliente, convenioId));
  }

  // Sem @Patch e sem @Delete: o histórico é imutável (ver migration 0022).
  @Post()
  @Papeis('Administrador', 'GestorConvenios', 'Financeiro')
  async criar(
    @ClienteSupabase() cliente: SupabaseClient,
    @UsuarioAtual() usuario: { id: string; email: string },
    @Param('convenioId') convenioId: string,
    @Body() corpo: unknown,
  ) {
    const dados = validarComEsquema(esquemaCriarObservacaoConvenio, { ...(corpo as object), convenioId });
    return paraCamelCase(await this.service.criar(cliente, dados, usuario.email));
  }
}
