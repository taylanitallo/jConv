import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { AtualizarRepasse, CriarRepasse } from '@jconv/compartilhado';
import { desembrulhar } from '../../comum/supabase-erro';

@Injectable()
export class RepassesService {
  async listar(cliente: SupabaseClient, convenioId: string) {
    return desembrulhar(
      await cliente.from('repasses').select('*').eq('convenio_id', convenioId).order('data', { ascending: false }),
    );
  }

  async criar(cliente: SupabaseClient, dados: CriarRepasse) {
    return desembrulhar(
      await cliente
        .from('repasses')
        .insert({
          convenio_id: dados.convenioId,
          tipo: dados.tipo,
          data: dados.data,
          valor: dados.valor,
          observacoes: dados.observacoes ?? null,
        })
        .select()
        .single(),
    );
  }

  async atualizar(cliente: SupabaseClient, id: string, dados: AtualizarRepasse) {
    const payload: Record<string, unknown> = {};
    if (dados.tipo !== undefined) payload.tipo = dados.tipo;
    if (dados.data !== undefined) payload.data = dados.data;
    if (dados.valor !== undefined) payload.valor = dados.valor;
    if (dados.observacoes !== undefined) payload.observacoes = dados.observacoes;

    return desembrulhar(await cliente.from('repasses').update(payload).eq('id', id).select().single());
  }

  async excluir(cliente: SupabaseClient, id: string) {
    desembrulhar(await cliente.from('repasses').delete().eq('id', id));
  }
}
