import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { IaService } from './ia.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PapeisGuard } from '../../guardas/papeis.guard';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';

@Controller('ia')
@UseGuards(AutenticacaoGuard, PapeisGuard)
export class IaController {
  constructor(private readonly service: IaService) {}

  @Post('perguntar')
  async perguntar(@ClienteSupabase() cliente: SupabaseClient, @Body('pergunta') pergunta: unknown) {
    if (typeof pergunta !== 'string' || !pergunta.trim()) {
      throw new BadRequestException('Informe a pergunta');
    }
    const resposta = await this.service.perguntar(cliente, pergunta);
    return { resposta };
  }

  @Get('resumo/convenio/:id')
  async resumoConvenio(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string) {
    const resumo = await this.service.resumoConvenio(cliente, id);
    return { resumo };
  }

  @Get('resumo/geral')
  async resumoGeral(
    @ClienteSupabase() cliente: SupabaseClient,
    @Query('esfera') esfera?: string,
    @Query('orgaoConcedenteId') orgaoConcedenteId?: string,
    @Query('statusGeral') statusGeral?: string,
  ) {
    const resumo = await this.service.resumoGeral(cliente, { esfera, orgaoConcedenteId, statusGeral });
    return { resumo };
  }

  @Post('extrair-documento/:id')
  async extrairDocumento(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string) {
    return this.service.extrairDocumento(cliente, id);
  }
}
