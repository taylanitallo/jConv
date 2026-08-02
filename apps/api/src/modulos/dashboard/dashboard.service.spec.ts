import { SupabaseClient } from '@supabase/supabase-js';
import { DashboardService } from './dashboard.service';

// Cliente Supabase mínimo: cada tabela devolve as linhas fixas do teste, ignorando os
// encadeamentos de filtro (eq/in/gte/lte), que aqui não precisam ser exercitados.
function clienteFalso(tabelas: Record<string, unknown[]>): SupabaseClient {
  return {
    from(tabela: string) {
      const resultado = Promise.resolve({ data: tabelas[tabela] ?? [], error: null });
      const encadeavel: Record<string, unknown> = {
        then: resultado.then.bind(resultado),
        catch: resultado.catch.bind(resultado),
      };
      for (const metodo of ['select', 'eq', 'in', 'gte', 'lte']) {
        encadeavel[metodo] = () => encadeavel;
      }
      return encadeavel;
    },
  } as unknown as SupabaseClient;
}

function emDias(dias: number) {
  const data = new Date();
  data.setHours(0, 0, 0, 0);
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

function convenio(parcial: Partial<Record<string, unknown>> & { id: string }) {
  return {
    esfera: 'Estadual',
    orgao_concedente_id: 'org-1',
    status_geral: 'ObraEmExecucao',
    valor_conveniado: 0,
    valor_concedido: 0,
    percentual_executado_fisico: null,
    percentual_executado_financeiro: null,
    data_fim_vigencia: null,
    objeto: `Objeto ${parcial.id}`,
    numero_convenio: null,
    ...parcial,
  };
}

describe('DashboardService — detalhamento dos cards', () => {
  const service = new DashboardService();

  const cliente = clienteFalso({
    orgaos_concedentes: [{ id: 'org-1', nome: 'SEINFRA' }],
    convenios: [
      convenio({ id: 'a', valor_conveniado: 100, valor_concedido: 100, data_fim_vigencia: emDias(10) }),
      convenio({ id: 'b', valor_conveniado: 300, valor_concedido: 200, data_fim_vigencia: emDias(45) }),
      convenio({ id: 'c', valor_conveniado: 50, status_geral: 'ObraParada', data_fim_vigencia: emDias(80) }),
      convenio({ id: 'd', status_geral: 'PcEnviada', data_fim_vigencia: emDias(20) }),
      // Encerrado: não deve entrar em nenhuma faixa de vencimento, mesmo vencendo em 5 dias.
      convenio({ id: 'e', status_geral: 'PcAprovada', data_fim_vigencia: emDias(5) }),
    ],
    repasses: [{ convenio_id: 'a', valor: 40, data: '2026-01-15' }],
  });

  it('devolve, para cada card, a lista de ids que compõe o número exibido', async () => {
    const dados = await service.obterDados(cliente, {});
    const { indicadores, detalhamento } = dados as any;

    // A contagem do card e o tamanho da lista da janela precisam bater sempre.
    for (const [chave, ids] of Object.entries(detalhamento.porIndicador) as [string, string[]][]) {
      if (['vencendo30Dias', 'vencendo60Dias', 'vencendo90Dias', 'obrasParadas', 'pcsPendentes', 'quantidadeConvenios'].includes(chave)) {
        expect({ chave, total: ids.length }).toEqual({ chave, total: indicadores[chave] });
      }
    }

    expect(detalhamento.porIndicador.vencendo30Dias).toEqual(['a', 'd']);
    expect(detalhamento.porIndicador.vencendo60Dias).toEqual(['a', 'd', 'b']);
    expect(detalhamento.porIndicador.vencendo90Dias).toEqual(['a', 'd', 'b', 'c']);
    expect(detalhamento.porIndicador.obrasParadas).toEqual(['c']);
    expect(detalhamento.porIndicador.pcsPendentes).toEqual(['d']);
    expect(detalhamento.porIndicador.quantidadeConvenios).toHaveLength(5);
  });

  it('ordena as listas de valor do maior para o menor e omite convênios zerados', async () => {
    const { detalhamento } = (await service.obterDados(cliente, {})) as any;

    expect(detalhamento.porIndicador.totalConveniado).toEqual(['b', 'a', 'c']);
    expect(detalhamento.porIndicador.totalRepassado).toEqual(['a']);
    // 'a' recebeu 40 de 100 -> 60 a receber; 'b' não recebeu nada -> 200.
    expect(detalhamento.porIndicador.totalAReceber).toEqual(['b', 'a']);
  });

  it('calcula repassado e a receber por convênio', async () => {
    const { detalhamento } = (await service.obterDados(cliente, {})) as any;
    const porId = new Map(detalhamento.convenios.map((c: any) => [c.id, c]));

    expect(porId.get('a')).toMatchObject({ valorRepassado: 40, valorAReceber: 60, orgao: 'SEINFRA' });
    expect(porId.get('b')).toMatchObject({ valorRepassado: 0, valorAReceber: 200 });
  });
});
