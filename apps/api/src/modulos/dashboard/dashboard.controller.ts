import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { DashboardService } from './dashboard.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PapeisGuard } from '../../guardas/papeis.guard';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('dashboard')
@UseGuards(AutenticacaoGuard, PapeisGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  async obter(
    @ClienteSupabase() cliente: SupabaseClient,
    @Query('esfera') esfera?: string,
    @Query('orgaoConcedenteId') orgaoConcedenteId?: string,
    @Query('statusGeral') statusGeral?: string,
    @Query('empresaContratadaId') empresaContratadaId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return paraCamelCase(
      await this.service.obterDados(cliente, {
        esfera,
        orgaoConcedenteId,
        statusGeral,
        empresaContratadaId,
        dataInicio,
        dataFim,
      }),
    );
  }
}
