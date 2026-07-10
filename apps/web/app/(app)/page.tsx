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
import { CartaoIndicador } from './_componentes/cartao-indicador';
import { abrirRelatorioDashboard } from '../../lib/api/relatorios';

interface DadosDashboard {
  indicadores: {
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
  };
  porStatus: { chave: string; quantidade: number }[];
  porEsfera: { chave: string; quantidade: number }[];
  rankingOrgaos: { orgao: string; valor: number }[];
  execucaoFisicoFinanceiro: { objeto: string; fisico: number; financeiro: number }[];
  evolucaoRepasses: { mes: string; valor: number }[];
}

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
            onClick={() => abrirRelatorioDashboard({ esfera: filtroEsfera, orgaoConcedenteId: filtroOrgao, statusGeral: filtroStatus })}
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
        <CartaoIndicador rotulo="Total conveniado" valor={formatarMoeda(indicadores.totalConveniado)} />
        <CartaoIndicador rotulo="Total concedido" valor={formatarMoeda(indicadores.totalConcedido)} />
        <CartaoIndicador rotulo="Total repassado" valor={formatarMoeda(indicadores.totalRepassado)} cor="bom" />
        <CartaoIndicador rotulo="Total a receber" valor={formatarMoeda(indicadores.totalAReceber)} cor="atencao" />
        <CartaoIndicador rotulo="Convênios" valor={String(indicadores.quantidadeConvenios)} />
        <CartaoIndicador rotulo="Vencendo em 30 dias" valor={String(indicadores.vencendo30Dias)} cor={indicadores.vencendo30Dias > 0 ? 'critico' : 'neutro'} />
        <CartaoIndicador rotulo="Vencendo em 60 dias" valor={String(indicadores.vencendo60Dias)} cor={indicadores.vencendo60Dias > 0 ? 'atencao' : 'neutro'} />
        <CartaoIndicador rotulo="Vencendo em 90 dias" valor={String(indicadores.vencendo90Dias)} />
        <CartaoIndicador rotulo="Obras paradas" valor={String(indicadores.obrasParadas)} cor={indicadores.obrasParadas > 0 ? 'critico' : 'bom'} />
        <CartaoIndicador rotulo="PCs pendentes" valor={String(indicadores.pcsPendentes)} cor={indicadores.pcsPendentes > 0 ? 'atencao' : 'bom'} />
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
    </div>
  );
}
