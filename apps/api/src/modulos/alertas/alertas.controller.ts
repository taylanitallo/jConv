import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ClienteDados } from '../../banco/cliente-dados';
import { desembrulhar } from '../../comum/supabase-erro';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PermissoesGuard } from '../../guardas/permissoes.guard';
import { Permissao } from '../../comum/decoradores/permissao.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('alertas')
@UseGuards(AutenticacaoGuard, PermissoesGuard)
@Permissao('Convenios', 'Parcial')
export class AlertasController {
  @Get()
  async listar(@ClienteSupabase() cliente: ClienteDados, @Query('status') status?: string) {
    let consulta = cliente.from('alertas').select('*').order('data_disparo', { ascending: false });
    if (status) consulta = consulta.eq('status', status);
    return paraCamelCase(desembrulhar(await consulta));
  }

  @Patch(':id')
  async atualizar(
    @ClienteSupabase() cliente: ClienteDados,
    @Param('id') id: string,
    @Body('status') status: 'Lido' | 'Resolvido',
  ) {
    return paraCamelCase(
      desembrulhar(await cliente.from('alertas').update({ status }).eq('id', id).select().single()),
    );
  }
}
