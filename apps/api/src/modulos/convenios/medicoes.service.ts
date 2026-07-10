import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { AtualizarMedicao, CriarMedicao } from '@jconv/compartilhado';
import { desembrulhar } from '../../comum/supabase-erro';

@Injectable()
export class MedicoesService {
  async listar(cliente: SupabaseClient, convenioId: string) {
    return desembrulhar(
      await cliente.from('medicoes').select('*').eq('convenio_id', convenioId).order('numero_medicao'),
    );
  }

  async criar(cliente: SupabaseClient, dados: CriarMedicao) {
    return desembrulhar(
      await cliente
        .from('medicoes')
        .insert({
          convenio_id: dados.convenioId,
          numero_medicao: dados.numeroMedicao,
          data: dados.data,
          percentual_acumulado: dados.percentualAcumulado ?? null,
          valor_pago: dados.valorPago ?? null,
          valor_a_pagar: dados.valorAPagar ?? null,
          status: dados.status,
          observacoes: dados.observacoes ?? null,
        })
        .select()
        .single(),
    );
  }

  async atualizar(cliente: SupabaseClient, id: string, dados: AtualizarMedicao) {
    const payload: Record<string, unknown> = {};
    if (dados.numeroMedicao !== undefined) payload.numero_medicao = dados.numeroMedicao;
    if (dados.data !== undefined) payload.data = dados.data;
    if (dados.percentualAcumulado !== undefined) payload.percentual_acumulado = dados.percentualAcumulado;
    if (dados.valorPago !== undefined) payload.valor_pago = dados.valorPago;
    if (dados.valorAPagar !== undefined) payload.valor_a_pagar = dados.valorAPagar;
    if (dados.status !== undefined) payload.status = dados.status;
    if (dados.observacoes !== undefined) payload.observacoes = dados.observacoes;

    return desembrulhar(await cliente.from('medicoes').update(payload).eq('id', id).select().single());
  }

  async excluir(cliente: SupabaseClient, id: string) {
    desembrulhar(await cliente.from('medicoes').delete().eq('id', id));
  }
}
