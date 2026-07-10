import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { AtualizarAditivo, CriarAditivo } from '@jconv/compartilhado';
import { desembrulhar } from '../../comum/supabase-erro';

@Injectable()
export class AditivosService {
  async listar(cliente: SupabaseClient, convenioId: string) {
    return desembrulhar(
      await cliente.from('aditivos').select('*').eq('convenio_id', convenioId).order('data', { ascending: false }),
    );
  }

  async criar(cliente: SupabaseClient, dados: CriarAditivo) {
    return desembrulhar(
      await cliente
        .from('aditivos')
        .insert({ convenio_id: dados.convenioId, tipo: dados.tipo, data: dados.data, descricao: dados.descricao })
        .select()
        .single(),
    );
  }

  async atualizar(cliente: SupabaseClient, id: string, dados: AtualizarAditivo) {
    const payload: Record<string, unknown> = {};
    if (dados.tipo !== undefined) payload.tipo = dados.tipo;
    if (dados.data !== undefined) payload.data = dados.data;
    if (dados.descricao !== undefined) payload.descricao = dados.descricao;

    return desembrulhar(await cliente.from('aditivos').update(payload).eq('id', id).select().single());
  }

  async excluir(cliente: SupabaseClient, id: string) {
    desembrulhar(await cliente.from('aditivos').delete().eq('id', id));
  }
}
