import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ClienteDados } from '../../banco/cliente-dados';
import { IaService } from './ia.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PermissoesGuard } from '../../guardas/permissoes.guard';
import { Permissao } from '../../comum/decoradores/permissao.decorator';
import { ArmazenamentoSupabase, ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';

@Controller('ia')
@UseGuards(AutenticacaoGuard, PermissoesGuard)
@Permissao('Dashboard', 'Parcial')
export class IaController {
  constructor(private readonly service: IaService) {}

  @Post('perguntar')
  async perguntar(@ClienteSupabase() cliente: ClienteDados, @Body('pergunta') pergunta: unknown) {
    if (typeof pergunta !== 'string' || !pergunta.trim()) {
      throw new BadRequestException('Informe a pergunta');
    }
    const resposta = await this.service.perguntar(cliente, pergunta);
    return { resposta };
  }

  @Get('resumo/convenio/:id')
  async resumoConvenio(@ClienteSupabase() cliente: ClienteDados, @Param('id') id: string) {
    const resumo = await this.service.resumoConvenio(cliente, id);
    return { resumo };
  }

  @Get('resumo/geral')
  async resumoGeral(
    @ClienteSupabase() cliente: ClienteDados,
    @Query('esfera') esfera?: string,
    @Query('orgaoConcedenteId') orgaoConcedenteId?: string,
    @Query('statusGeral') statusGeral?: string,
  ) {
    const resumo = await this.service.resumoGeral(cliente, { esfera, orgaoConcedenteId, statusGeral });
    return { resumo };
  }

  @Post('extrair-documento/:id')
  async extrairDocumento(
    @ClienteSupabase() cliente: ClienteDados,
    @ArmazenamentoSupabase() armazenamento: SupabaseClient,
    @Param('id') id: string,
  ) {
    return this.service.extrairDocumento(cliente, armazenamento, id);
  }
}
