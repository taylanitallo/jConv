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
  numero_convenio: string | null;
}

// Convênio "achatado" que alimenta o detalhamento dos cards do Dashboard: cada card devolve a
// lista de ids que o compõem e o frontend resolve contra esta lista para montar a janela.
export interface ConvenioDetalhado {
  id: string;
  numeroConvenio: string | null;
  objeto: string;
  orgao: string;
  esfera: string;
  statusGeral: string;
  valorConveniado: number;
  valorConcedido: number;
  valorRepassado: number;
  valorAReceber: number;
  dataFimVigencia: string | null;
  diasParaVencer: number | null;
}

const STATUS_ENCERRADOS = ['ObraConcluida', 'PcAprovada'];
const STATUS_PC_PENDENTE = ['EmPrestacaoContas', 'PcEnviada'];

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
        'id, esfera, orgao_concedente_id, status_geral, valor_conveniado, valor_concedido, percentual_executado_fisico, percentual_executado_financeiro, data_fim_vigencia, objeto, numero_convenio',
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

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const repassadoPorConvenio = new Map<string, number>();
    for (const r of repasses) {
      repassadoPorConvenio.set(r.convenio_id, (repassadoPorConvenio.get(r.convenio_id) ?? 0) + r.valor);
    }

    const detalhados: ConvenioDetalhado[] = convenios.map((c) => {
      const valorConcedido = c.valor_concedido ?? 0;
      const valorRepassado = repassadoPorConvenio.get(c.id) ?? 0;
      return {
        id: c.id,
        numeroConvenio: c.numero_convenio,
        objeto: c.objeto,
        orgao: nomeOrgao.get(c.orgao_concedente_id) ?? 'Desconhecido',
        esfera: c.esfera,
        statusGeral: c.status_geral,
        valorConveniado: c.valor_conveniado ?? 0,
        valorConcedido,
        valorRepassado,
        valorAReceber: Math.max(valorConcedido - valorRepassado, 0),
        dataFimVigencia: c.data_fim_vigencia,
        diasParaVencer: c.data_fim_vigencia ? diasEntre(hoje, c.data_fim_vigencia) : null,
      };
    });

    // Cada lista abaixo é a "prova" do card correspondente: os indicadores são derivados delas
    // (length/soma), então o número exibido no card e as linhas da janela nunca divergem.
    const vencendoEm = (dias: number) =>
      detalhados
        .filter(
          (c) =>
            !STATUS_ENCERRADOS.includes(c.statusGeral) &&
            c.diasParaVencer != null &&
            c.diasParaVencer >= 0 &&
            c.diasParaVencer <= dias,
        )
        .sort((a, b) => (a.diasParaVencer ?? 0) - (b.diasParaVencer ?? 0));

    const porValorDesc = (campo: keyof ConvenioDetalhado) =>
      detalhados.filter((c) => (c[campo] as number) > 0).sort((a, b) => (b[campo] as number) - (a[campo] as number));

    const listaTotalConveniado = porValorDesc('valorConveniado');
    const listaTotalConcedido = porValorDesc('valorConcedido');
    const listaTotalRepassado = porValorDesc('valorRepassado');
    const listaTotalAReceber = porValorDesc('valorAReceber');
    const listaVencendo30 = vencendoEm(30);
    const listaVencendo60 = vencendoEm(60);
    const listaVencendo90 = vencendoEm(90);
    const listaObrasParadas = detalhados.filter((c) => c.statusGeral === 'ObraParada');
    const listaPcsPendentes = detalhados.filter((c) => STATUS_PC_PENDENTE.includes(c.statusGeral));

    // Indicadores principais
    const totalConveniado = soma(detalhados, (c) => c.valorConveniado);
    const totalConcedido = soma(detalhados, (c) => c.valorConcedido);
    const totalRepassado = soma(repasses, (r) => r.valor);
    const totalAReceber = Math.max(totalConcedido - totalRepassado, 0);

    const obrasParadas = listaObrasParadas.length;
    const pcsPendentes = listaPcsPendentes.length;

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
        quantidadeConvenios: detalhados.length,
        vencendo30Dias: listaVencendo30.length,
        vencendo60Dias: listaVencendo60.length,
        vencendo90Dias: listaVencendo90.length,
        obrasParadas,
        pcsPendentes,
      },
      porStatus,
      porEsfera,
      rankingOrgaos,
      execucaoFisicoFinanceiro,
      evolucaoRepasses,
      detalhamento: {
        convenios: detalhados,
        porIndicador: {
          totalConveniado: idsDe(listaTotalConveniado),
          totalConcedido: idsDe(listaTotalConcedido),
          totalRepassado: idsDe(listaTotalRepassado),
          totalAReceber: idsDe(listaTotalAReceber),
          quantidadeConvenios: idsDe(detalhados),
          vencendo30Dias: idsDe(listaVencendo30),
          vencendo60Dias: idsDe(listaVencendo60),
          vencendo90Dias: idsDe(listaVencendo90),
          obrasParadas: idsDe(listaObrasParadas),
          pcsPendentes: idsDe(listaPcsPendentes),
        },
      },
    };
  }
}

function idsDe(itens: ConvenioDetalhado[]) {
  return itens.map((c) => c.id);
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
