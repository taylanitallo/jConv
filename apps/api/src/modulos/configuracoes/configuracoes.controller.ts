import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { esquemaAtualizarConfiguracao } from '@jconv/compartilhado';
import { ConfiguracoesService } from './configuracoes.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PapeisGuard } from '../../guardas/papeis.guard';
import { Papeis } from '../../comum/decoradores/papeis.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { validarComEsquema } from '../../comum/validar';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('configuracoes')
@UseGuards(AutenticacaoGuard, PapeisGuard)
export class ConfiguracoesController {
  constructor(private readonly service: ConfiguracoesService) {}

  // Leitura liberada a qualquer perfil: o nome do município e o layout dos relatórios são
  // usados em telas que todo mundo enxerga.
  @Get()
  async obter(@ClienteSupabase() cliente: SupabaseClient) {
    return paraCamelCase(await this.service.obter(cliente));
  }

  @Patch()
  @Papeis('Administrador')
  async atualizar(@ClienteSupabase() cliente: SupabaseClient, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaAtualizarConfiguracao, corpo);
    return paraCamelCase(await this.service.atualizar(cliente, dados));
  }
}
