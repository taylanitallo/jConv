import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { AtualizarConvenio, CriarConvenio } from '@jconv/compartilhado';
import { desembrulhar } from '../../comum/supabase-erro';

function paraPayload(dados: Partial<CriarConvenio>): Record<string, unknown> {
  const mapa: Record<string, string> = {
    orgaoConcedenteId: 'orgao_concedente_id',
    tipoInstrumento: 'tipo_instrumento',
    objeto: 'objeto',
    valorConveniado: 'valor_conveniado',
    valorConcedido: 'valor_concedido',
    valorContrapartida: 'valor_contrapartida',
    valorLicitado: 'valor_licitado',
    numeroConvenio: 'numero_convenio',
    numeroMapp: 'numero_mapp',
    numeroSic: 'numero_sic',
    numeroProposta: 'numero_proposta',
    numeroProtocolo: 'numero_protocolo',
    numeroNup: 'numero_nup',
    numeroOperacaoCaixa: 'numero_operacao_caixa',
    contaBancaria: 'conta_bancaria',
    dataAssinatura: 'data_assinatura',
    dataInicioVigencia: 'data_inicio_vigencia',
    dataFimVigencia: 'data_fim_vigencia',
    empresaContratadaId: 'empresa_contratada_id',
    vigenciaContratoEmpresa: 'vigencia_contrato_empresa',
    saldoEmConta: 'saldo_em_conta',
    saldoEmContaReferenciaEm: 'saldo_em_conta_referencia_em',
    statusGeral: 'status_geral',
    percentualExecutadoFisico: 'percentual_executado_fisico',
    percentualExecutadoFinanceiro: 'percentual_executado_financeiro',
    observacoes: 'observacoes',
  };

  const payload: Record<string, unknown> = {};
  for (const [chaveCamel, chaveSnake] of Object.entries(mapa)) {
    if ((dados as Record<string, unknown>)[chaveCamel] !== undefined) {
      payload[chaveSnake] = (dados as Record<string, unknown>)[chaveCamel];
    }
  }
  return payload;
}

export interface FiltrosConvenio {
  esfera?: string;
  orgaoConcedenteId?: string;
  statusGeral?: string;
  empresaContratadaId?: string;
}

@Injectable()
export class ConveniosService {
  async listar(cliente: SupabaseClient, filtros: FiltrosConvenio) {
    let consulta = cliente.from('convenios').select('*').order('criado_em', { ascending: false });
    if (filtros.esfera) consulta = consulta.eq('esfera', filtros.esfera);
    if (filtros.orgaoConcedenteId) consulta = consulta.eq('orgao_concedente_id', filtros.orgaoConcedenteId);
    if (filtros.statusGeral) consulta = consulta.eq('status_geral', filtros.statusGeral);
    if (filtros.empresaContratadaId) consulta = consulta.eq('empresa_contratada_id', filtros.empresaContratadaId);
    return desembrulhar(await consulta);
  }

  async obter(cliente: SupabaseClient, id: string) {
    return desembrulhar(await cliente.from('convenios').select('*').eq('id', id).single());
  }

  async criar(cliente: SupabaseClient, dados: CriarConvenio) {
    return desembrulhar(await cliente.from('convenios').insert(paraPayload(dados)).select().single());
  }

  async atualizar(cliente: SupabaseClient, id: string, dados: AtualizarConvenio) {
    return desembrulhar(await cliente.from('convenios').update(paraPayload(dados)).eq('id', id).select().single());
  }

  async excluir(cliente: SupabaseClient, id: string) {
    desembrulhar(await cliente.from('convenios').delete().eq('id', id));
  }
}
