import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { AtualizarProposta, CriarProposta, PromoverPropostaParaConvenio } from '@jconv/compartilhado';
import { desembrulhar } from '../../comum/supabase-erro';

@Injectable()
export class PropostasService {
  async listar(cliente: SupabaseClient) {
    return desembrulhar(await cliente.from('propostas').select('*').order('criado_em', { ascending: false }));
  }

  async obter(cliente: SupabaseClient, id: string) {
    return desembrulhar(await cliente.from('propostas').select('*').eq('id', id).single());
  }

  async criar(cliente: SupabaseClient, dados: CriarProposta) {
    return desembrulhar(
      await cliente
        .from('propostas')
        .insert({
          orgao_concedente_id: dados.orgaoConcedenteId,
          objeto: dados.objeto,
          numero_protocolo: dados.numeroProtocolo ?? null,
          numero_nup: dados.numeroNup ?? null,
          status: dados.status,
          observacoes: dados.observacoes ?? null,
        })
        .select()
        .single(),
    );
  }

  async atualizar(cliente: SupabaseClient, id: string, dados: AtualizarProposta) {
    const payload: Record<string, unknown> = {};
    if (dados.orgaoConcedenteId !== undefined) payload.orgao_concedente_id = dados.orgaoConcedenteId;
    if (dados.objeto !== undefined) payload.objeto = dados.objeto;
    if (dados.numeroProtocolo !== undefined) payload.numero_protocolo = dados.numeroProtocolo;
    if (dados.numeroNup !== undefined) payload.numero_nup = dados.numeroNup;
    if (dados.status !== undefined) payload.status = dados.status;
    if (dados.observacoes !== undefined) payload.observacoes = dados.observacoes;

    return desembrulhar(await cliente.from('propostas').update(payload).eq('id', id).select().single());
  }

  async excluir(cliente: SupabaseClient, id: string) {
    desembrulhar(await cliente.from('propostas').delete().eq('id', id));
  }

  async promover(cliente: SupabaseClient, propostaId: string, dados: PromoverPropostaParaConvenio) {
    const { data, error } = await cliente.rpc('promover_proposta_para_convenio', {
      p_proposta_id: propostaId,
      p_tipo_instrumento: dados.tipoInstrumento,
      p_valor_conveniado: dados.valorConveniado ?? null,
      p_valor_concedido: dados.valorConcedido ?? null,
      p_valor_contrapartida: dados.valorContrapartida ?? null,
      p_numero_convenio: dados.numeroConvenio ?? null,
      p_numero_mapp: dados.numeroMapp ?? null,
      p_numero_sic: dados.numeroSic ?? null,
      p_data_assinatura: dados.dataAssinatura ?? null,
      p_data_inicio_vigencia: dados.dataInicioVigencia ?? null,
      p_data_fim_vigencia: dados.dataFimVigencia ?? null,
    });
    if (error) throw error;
    return { convenioId: data as string };
  }
}
