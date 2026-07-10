import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { desembrulhar } from '../../comum/supabase-erro';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PapeisGuard } from '../../guardas/papeis.guard';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('alertas')
@UseGuards(AutenticacaoGuard, PapeisGuard)
export class AlertasController {
  @Get()
  async listar(@ClienteSupabase() cliente: SupabaseClient, @Query('status') status?: string) {
    let consulta = cliente.from('alertas').select('*').order('data_disparo', { ascending: false });
    if (status) consulta = consulta.eq('status', status);
    return paraCamelCase(desembrulhar(await consulta));
  }

  @Patch(':id')
  async atualizar(
    @ClienteSupabase() cliente: SupabaseClient,
    @Param('id') id: string,
    @Body('status') status: 'Lido' | 'Resolvido',
  ) {
    return paraCamelCase(
      desembrulhar(await cliente.from('alertas').update({ status }).eq('id', id).select().single()),
    );
  }
}
