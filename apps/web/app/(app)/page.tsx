'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ESFERAS_CONVENIO,
  ROTULOS_ESFERA_CONVENIO,
  STATUS_GERAL_CONVENIO,
  ROTULOS_STATUS_GERAL_CONVENIO,
  type OrgaoConcedente,
} from '@jconv/compartilhado';
import { chamarApi } from '../../lib/api/cliente';
import { orgaosConcedentesApi } from '../../lib/api/recursos';
import { usarAtualizacaoTempoReal } from '../../lib/supabase/usar-tempo-real';
import { PALETA_CATEGORICA, CHROME_GRAFICO } from '../../lib/paleta';
import { CartaoIndicador, type CartaoIndicadorProps } from './_componentes/cartao-indicador';
import {
  ModalDetalheIndicador,
  type ColunaDetalhe,
  type ConvenioDetalhado,
} from './_componentes/modal-detalhe-indicador';
import { ModalOrientacaoPdf } from './_componentes/modal-orientacao-pdf';
import { PainelAssistenteIa } from './_componentes/painel-assistente-ia';
import { abrirRelatorioDashboard } from '../../lib/api/relatorios';

interface IndicadoresDashboard {
  totalConveniado: number;
  totalConcedido: number;
  totalRepassado: number;
  totalAReceber: number;
  quantidadeConvenios: number;
  vencendo30Dias: number;
  vencendo60Dias: number;
  vencendo90Dias: number;
  obrasParadas: number;
  pcsPendentes: number;
}

type ChaveIndicador = keyof IndicadoresDashboard;

interface DadosDashboard {
  indicadores: IndicadoresDashboard;
  porStatus: { chave: string; quantidade: number }[];
  porEsfera: { chave: string; quantidade: number }[];
  rankingOrgaos: { orgao: string; valor: number }[];
  execucaoFisicoFinanceiro: { objeto: string; fisico: number; financeiro: number }[];
  evolucaoRepasses: { mes: string; valor: number }[];
  detalhamento: {
    convenios: ConvenioDetalhado[];
    porIndicador: Record<ChaveIndicador, string[]>;
  };
}

interface DefinicaoIndicador {
  chave: ChaveIndicador;
  rotulo: string;
  formato: 'moeda' | 'inteiro';
  /** Coluna extra mostrada na janela de detalhe deste indicador. */
  coluna: ColunaDetalhe;
  descricao: string;
  cor?: (valor: number) => CartaoIndicadorProps['cor'];
}

// Fonte única dos cards: rótulo, cor e a janela de detalhe saem todos daqui, então o título da
// janela nunca desencontra do card clicado.
const INDICADORES: DefinicaoIndicador[] = [
  {
    chave: 'totalConveniado',
    rotulo: 'Total conveniado',
    formato: 'moeda',
    coluna: 'valorConveniado',
    descricao: 'Convênios com valor conveniado registrado, do maior para o menor.',
  },
  {
    chave: 'totalConcedido',
    rotulo: 'Total concedido',
    formato: 'moeda',
    coluna: 'valorConcedido',
    descricao: 'Convênios com valor concedido pelo órgão, do maior para o menor.',
  },
  {
    chave: 'totalRepassado',
    rotulo: 'Total repassado',
    formato: 'moeda',
    coluna: 'valorRepassado',
    cor: () => 'bom',
    descricao: 'Convênios que já receberam repasses, com a soma repassada em cada um.',
  },
  {
    chave: 'totalAReceber',
    rotulo: 'Total a receber',
    formato: 'moeda',
    coluna: 'valorAReceber',
    cor: () => 'atencao',
    descricao: 'Convênios com saldo pendente (valor concedido menos o que já foi repassado).',
  },
  {
    chave: 'quantidadeConvenios',
    rotulo: 'Convênios',
    formato: 'inteiro',
    coluna: 'nenhuma',
    descricao: 'Todos os convênios que atendem aos filtros aplicados no Dashboard.',
  },
  {
    chave: 'vencendo30Dias',
    rotulo: 'Vencendo em 30 dias',
    formato: 'inteiro',
    coluna: 'vigencia',
    cor: (valor) => (valor > 0 ? 'critico' : 'neutro'),
    descricao: 'Convênios ainda não encerrados cuja vigência termina nos próximos 30 dias.',
  },
  {
    chave: 'vencendo60Dias',
    rotulo: 'Vencendo em 60 dias',
    formato: 'inteiro',
    coluna: 'vigencia',
    cor: (valor) => (valor > 0 ? 'atencao' : 'neutro'),
    descricao: 'Convênios ainda não encerrados cuja vigência termina nos próximos 60 dias.',
  },
  {
    chave: 'vencendo90Dias',
    rotulo: 'Vencendo em 90 dias',
    formato: 'inteiro',
    coluna: 'vigencia',
    descricao: 'Convênios ainda não encerrados cuja vigência termina nos próximos 90 dias.',
  },
  {
    chave: 'obrasParadas',
    rotulo: 'Obras paradas',
    formato: 'inteiro',
    coluna: 'valorConveniado',
    cor: (valor) => (valor > 0 ? 'critico' : 'bom'),
    descricao: 'Convênios com status "Obra Parada".',
  },
  {
    chave: 'pcsPendentes',
    rotulo: 'PCs pendentes',
    formato: 'inteiro',
    coluna: 'valorConveniado',
    cor: (valor) => (valor > 0 ? 'atencao' : 'bom'),
    descricao: 'Convênios em prestação de contas ou com PC enviada aguardando análise.',
  },
];

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

export default function PaginaDashboard() {
  const [orgaos, setOrgaos] = useState<OrgaoConcedente[]>([]);
  const [filtroEsfera, setFiltroEsfera] = useState('');
  const [filtroOrgao, setFiltroOrgao] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [dados, setDados] = useState<DadosDashboard | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const [indicadorAberto, setIndicadorAberto] = useState<ChaveIndicador | null>(null);
  const [escolhendoOrientacao, setEscolhendoOrientacao] = useState(false);

  const carregar = useCallback(async () => {
    const params = new URLSearchParams();
    if (filtroEsfera) params.set('esfera', filtroEsfera);
    if (filtroOrgao) params.set('orgaoConcedenteId', filtroOrgao);
    if (filtroStatus) params.set('statusGeral', filtroStatus);
    const resultado = await chamarApi<DadosDashboard>(`/dashboard?${params.toString()}`);
    setDados(resultado);
    setAtualizadoEm(new Date());
  }, [filtroEsfera, filtroOrgao, filtroStatus]);

  useEffect(() => {
    orgaosConcedentesApi.listar().then(setOrgaos);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  usarAtualizacaoTempoReal(carregar);

  if (!dados) return <p className="text-sm text-neutral-500">Carregando…</p>;

  const { indicadores } = dados;

  const definicaoAberta = INDICADORES.find((def) => def.chave === indicadorAberto) ?? null;
  const porId = new Map(dados.detalhamento.convenios.map((c) => [c.id, c]));
  // A API já devolve os ids na ordem certa de cada indicador (valor desc, prazo asc); só resolvo.
  const itensAbertos = definicaoAberta
    ? (dados.detalhamento.porIndicador[definicaoAberta.chave] ?? [])
        .map((id) => porId.get(id))
        .filter((c): c is ConvenioDetalhado => c != null)
    : [];

  const dadosEsfera = dados.porEsfera.map((item) => ({
    nome: ROTULOS_ESFERA_CONVENIO[item.chave as keyof typeof ROTULOS_ESFERA_CONVENIO] ?? item.chave,
    quantidade: item.quantidade,
  }));

  const dadosStatus = dados.porStatus.map((item) => ({
    nome: ROTULOS_STATUS_GERAL_CONVENIO[item.chave as keyof typeof ROTULOS_STATUS_GERAL_CONVENIO] ?? item.chave,
    quantidade: item.quantidade,
  }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-3">
          {atualizadoEm && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Atualizado às {atualizadoEm.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <button
            type="button"
            onClick={() => setEscolhendoOrientacao(true)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={filtroEsfera}
          onChange={(e) => setFiltroEsfera(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          <option value="">Todas as esferas</option>
          {ESFERAS_CONVENIO.map((v) => (
            <option key={v} value={v}>
              {ROTULOS_ESFERA_CONVENIO[v]}
            </option>
          ))}
        </select>
        <select
          value={filtroOrgao}
          onChange={(e) => setFiltroOrgao(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          <option value="">Todos os órgãos</option>
          {orgaos.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </select>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          <option value="">Todos os status</option>
          {STATUS_GERAL_CONVENIO.map((v) => (
            <option key={v} value={v}>
              {ROTULOS_STATUS_GERAL_CONVENIO[v]}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {INDICADORES.map((def) => {
          const valor = indicadores[def.chave];
          return (
            <CartaoIndicador
              key={def.chave}
              rotulo={def.rotulo}
              valor={def.formato === 'moeda' ? formatarMoeda(valor) : String(valor)}
              cor={def.cor?.(valor) ?? 'neutro'}
              quantidadeDetalhes={(dados.detalhamento.porIndicador[def.chave] ?? []).length}
              aoClicar={() => setIndicadorAberto(def.chave)}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Convênios por esfera</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dadosEsfera}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHROME_GRAFICO.grade} vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 12, fill: CHROME_GRAFICO.textoMudo }} />
              <YAxis tick={{ fontSize: 12, fill: CHROME_GRAFICO.textoMudo }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="quantidade" name="Convênios" fill={PALETA_CATEGORICA[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Convênios por status</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dadosStatus} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHROME_GRAFICO.grade} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: CHROME_GRAFICO.textoMudo }} allowDecimals={false} />
              <YAxis type="category" dataKey="nome" width={140} tick={{ fontSize: 11, fill: CHROME_GRAFICO.textoMudo }} />
              <Tooltip />
              <Bar dataKey="quantidade" name="Convênios" fill={PALETA_CATEGORICA[1]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Ranking de órgãos por valor conveniado</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dados.rankingOrgaos} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHROME_GRAFICO.grade} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: CHROME_GRAFICO.textoMudo }} tickFormatter={(v) => formatarMoeda(v)} />
              <YAxis type="category" dataKey="orgao" width={160} tick={{ fontSize: 11, fill: CHROME_GRAFICO.textoMudo }} />
              <Tooltip formatter={(v) => formatarMoeda(Number(v))} />
              <Bar dataKey="valor" name="Valor conveniado" fill={PALETA_CATEGORICA[3]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Evolução de repasses</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dados.evolucaoRepasses}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHROME_GRAFICO.grade} vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: CHROME_GRAFICO.textoMudo }} />
              <YAxis tick={{ fontSize: 12, fill: CHROME_GRAFICO.textoMudo }} tickFormatter={(v) => formatarMoeda(v)} />
              <Tooltip formatter={(v) => formatarMoeda(Number(v))} />
              <Line type="monotone" dataKey="valor" name="Repasses" stroke={PALETA_CATEGORICA[0]} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Execução física x financeira</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dados.execucaoFisicoFinanceiro}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHROME_GRAFICO.grade} vertical={false} />
              <XAxis dataKey="objeto" tick={{ fontSize: 10, fill: CHROME_GRAFICO.textoMudo }} interval={0} angle={-20} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 12, fill: CHROME_GRAFICO.textoMudo }} unit="%" domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="fisico" name="% Físico" fill={PALETA_CATEGORICA[1]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="financeiro" name="% Financeiro" fill={PALETA_CATEGORICA[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6">
        <PainelAssistenteIa filtros={{ esfera: filtroEsfera, orgaoConcedenteId: filtroOrgao, statusGeral: filtroStatus }} />
      </div>

      {escolhendoOrientacao && (
        <ModalOrientacaoPdf
          titulo="Exportar Dashboard"
          aoFechar={() => setEscolhendoOrientacao(false)}
          aoConfirmar={(orientacao) => {
            setEscolhendoOrientacao(false);
            abrirRelatorioDashboard(
              { esfera: filtroEsfera, orgaoConcedenteId: filtroOrgao, statusGeral: filtroStatus },
              orientacao,
            );
          }}
        />
      )}

      {definicaoAberta && (
        <ModalDetalheIndicador
          titulo={definicaoAberta.rotulo}
          descricao={definicaoAberta.descricao}
          coluna={definicaoAberta.coluna}
          itens={itensAbertos}
          aoFechar={() => setIndicadorAberto(null)}
        />
      )}
    </div>
  );
}
