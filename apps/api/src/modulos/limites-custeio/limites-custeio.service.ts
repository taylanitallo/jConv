import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { AtualizarLimiteCusteio, CriarLimiteCusteio } from '@jconv/compartilhado';
import { desembrulhar } from '../../comum/supabase-erro';

@Injectable()
export class LimitesCusteioService {
  async listar(cliente: SupabaseClient) {
    return desembrulhar(
      await cliente.from('limites_custeio').select('*').order('competencia_ano', { ascending: false }),
    );
  }

  async obter(cliente: SupabaseClient, id: string) {
    return desembrulhar(await cliente.from('limites_custeio').select('*').eq('id', id).single());
  }

  async criar(cliente: SupabaseClient, dados: CriarLimiteCusteio) {
    return desembrulhar(
      await cliente
        .from('limites_custeio')
        .insert({
          orgao_concedente_id: dados.orgaoConcedenteId,
          tipo: dados.tipo,
          portaria_referencia: dados.portariaReferencia ?? null,
          competencia_ano: dados.competenciaAno,
          valor_teto: dados.valorTeto,
          valor_utilizado: dados.valorUtilizado ?? 0,
          observacoes: dados.observacoes ?? null,
        })
        .select()
        .single(),
    );
  }

  async atualizar(cliente: SupabaseClient, id: string, dados: AtualizarLimiteCusteio) {
    const payload: Record<string, unknown> = {};
    if (dados.orgaoConcedenteId !== undefined) payload.orgao_concedente_id = dados.orgaoConcedenteId;
    if (dados.tipo !== undefined) payload.tipo = dados.tipo;
    if (dados.portariaReferencia !== undefined) payload.portaria_referencia = dados.portariaReferencia;
    if (dados.competenciaAno !== undefined) payload.competencia_ano = dados.competenciaAno;
    if (dados.valorTeto !== undefined) payload.valor_teto = dados.valorTeto;
    if (dados.valorUtilizado !== undefined) payload.valor_utilizado = dados.valorUtilizado;
    if (dados.observacoes !== undefined) payload.observacoes = dados.observacoes;

    return desembrulhar(await cliente.from('limites_custeio').update(payload).eq('id', id).select().single());
  }

  async excluir(cliente: SupabaseClient, id: string) {
    desembrulhar(await cliente.from('limites_custeio').delete().eq('id', id));
  }
}
