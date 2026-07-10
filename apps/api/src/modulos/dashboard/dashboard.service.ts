import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { desembrulhar } from '../../comum/supabase-erro';

export interface FiltrosDashboard {
  esfera?: string;
  orgaoConcedenteId?: string;
  statusGeral?: string;
  empresaContratadaId?: string;
  dataInicio?: string;
  dataFim?: string;
}

interface LinhaConvenio {
  id: string;
  esfera: string;
  orgao_concedente_id: string;
  status_geral: string;
  valor_conveniado: number | null;
  valor_concedido: number | null;
  percentual_executado_fisico: number | null;
  percentual_executado_financeiro: number | null;
  data_fim_vigencia: string | null;
  objeto: string;
}

const STATUS_ENCERRADOS = ['ObraConcluida', 'PcAprovada'];

function diasEntre(hoje: Date, dataIso: string) {
  const alvo = new Date(dataIso);
  return Math.ceil((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

@Injectable()
export class DashboardService {
  async obterDados(cliente: SupabaseClient, filtros: FiltrosDashboard) {
    let consulta = cliente
      .from('convenios')
      .select(
        'id, esfera, orgao_concedente_id, status_geral, valor_conveniado, valor_concedido, percentual_executado_fisico, percentual_executado_financeiro, data_fim_vigencia, objeto',
      );

    if (filtros.esfera) consulta = consulta.eq('esfera', filtros.esfera);
    if (filtros.orgaoConcedenteId) consulta = consulta.eq('orgao_concedente_id', filtros.orgaoConcedenteId);
    if (filtros.statusGeral) consulta = consulta.eq('status_geral', filtros.statusGeral);
    if (filtros.empresaContratadaId) consulta = consulta.eq('empresa_contratada_id', filtros.empresaContratadaId);
    if (filtros.dataInicio) consulta = consulta.gte('data_assinatura', filtros.dataInicio);
    if (filtros.dataFim) consulta = consulta.lte('data_assinatura', filtros.dataFim);

    const convenios = desembrulhar<LinhaConvenio[]>(await consulta);
    const idsConvenios = convenios.map((c) => c.id);

    const repasses = idsConvenios.length
      ? desembrulhar<{ convenio_id: string; valor: number; data: string }[]>(
          await cliente.from('repasses').select('convenio_id, valor, data').in('convenio_id', idsConvenios),
        )
      : [];

    const orgaos = desembrulhar<{ id: string; nome: string }[]>(
      await cliente.from('orgaos_concedentes').select('id, nome'),
    );
    const nomeOrgao = new Map(orgaos.map((o) => [o.id, o.nome]));

    // Indicadores principais
    const totalConveniado = soma(convenios, (c) => c.valor_conveniado);
    const totalConcedido = soma(convenios, (c) => c.valor_concedido);
    const totalRepassado = soma(repasses, (r) => r.valor);
    const totalAReceber = Math.max(totalConcedido - totalRepassado, 0);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencendoEm = (dias: number) =>
      convenios.filter(
        (c) =>
          c.data_fim_vigencia &&
          !STATUS_ENCERRADOS.includes(c.status_geral) &&
          diasEntre(hoje, c.data_fim_vigencia) >= 0 &&
          diasEntre(hoje, c.data_fim_vigencia) <= dias,
      ).length;

    const obrasParadas = convenios.filter((c) => c.status_geral === 'ObraParada').length;
    const pcsPendentes = convenios.filter((c) => ['EmPrestacaoContas', 'PcEnviada'].includes(c.status_geral)).length;

    // Distribuições
    const porStatus = contarPorChave(convenios, (c) => c.status_geral);
    const porEsfera = contarPorChave(convenios, (c) => c.esfera);

    const porOrgao = new Map<string, number>();
    for (const c of convenios) {
      porOrgao.set(c.orgao_concedente_id, (porOrgao.get(c.orgao_concedente_id) ?? 0) + (c.valor_conveniado ?? 0));
    }
    const rankingOrgaos = [...porOrgao.entries()]
      .map(([orgaoId, valor]) => ({ orgao: nomeOrgao.get(orgaoId) ?? 'Desconhecido', valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);

    const execucaoFisicoFinanceiro = convenios
      .filter((c) => c.percentual_executado_fisico != null || c.percentual_executado_financeiro != null)
      .map((c) => ({
        objeto: c.objeto.length > 40 ? `${c.objeto.slice(0, 40)}…` : c.objeto,
        fisico: c.percentual_executado_fisico ?? 0,
        financeiro: c.percentual_executado_financeiro ?? 0,
      }))
      .slice(0, 15);

    const porMes = new Map<string, number>();
    for (const r of repasses) {
      const mes = r.data.slice(0, 7);
      porMes.set(mes, (porMes.get(mes) ?? 0) + r.valor);
    }
    const evolucaoRepasses = [...porMes.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, valor]) => ({ mes, valor }));

    return {
      indicadores: {
        totalConveniado,
        totalConcedido,
        totalRepassado,
        totalAReceber,
        quantidadeConvenios: convenios.length,
        vencendo30Dias: vencendoEm(30),
        vencendo60Dias: vencendoEm(60),
        vencendo90Dias: vencendoEm(90),
        obrasParadas,
        pcsPendentes,
      },
      porStatus,
      porEsfera,
      rankingOrgaos,
      execucaoFisicoFinanceiro,
      evolucaoRepasses,
    };
  }
}

function soma<T>(itens: T[], seletor: (item: T) => number | null | undefined) {
  return itens.reduce((acc, item) => acc + (seletor(item) ?? 0), 0);
}

function contarPorChave<T>(itens: T[], seletor: (item: T) => string) {
  const mapa = new Map<string, number>();
  for (const item of itens) {
    const chave = seletor(item);
    mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
  }
  return [...mapa.entries()].map(([chave, quantidade]) => ({ chave, quantidade }));
}
