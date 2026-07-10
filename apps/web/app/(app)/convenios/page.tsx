'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ESFERAS_CONVENIO,
  ROTULOS_ESFERA_CONVENIO,
  STATUS_GERAL_CONVENIO,
  ROTULOS_STATUS_GERAL_CONVENIO,
  COR_STATUS_GERAL_CONVENIO,
  type Convenio,
  type OrgaoConcedente,
} from '@jconv/compartilhado';
import { chamarApi } from '../../../lib/api/cliente';
import { orgaosConcedentesApi } from '../../../lib/api/recursos';

function formatarMoeda(valor: number | null) {
  if (valor == null) return '—';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const CORES_BADGE: Record<string, string> = {
  verde: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  amarelo: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  vermelho: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  neutro: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
};

export default function PaginaConvenios() {
  const [itens, setItens] = useState<Convenio[]>([]);
  const [orgaos, setOrgaos] = useState<OrgaoConcedente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroEsfera, setFiltroEsfera] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroOrgao, setFiltroOrgao] = useState('');

  async function carregar() {
    setCarregando(true);
    const params = new URLSearchParams();
    if (filtroEsfera) params.set('esfera', filtroEsfera);
    if (filtroStatus) params.set('statusGeral', filtroStatus);
    if (filtroOrgao) params.set('orgaoConcedenteId', filtroOrgao);
    const [convenios, orgaosLista] = await Promise.all([
      chamarApi<Convenio[]>(`/convenios?${params.toString()}`),
      orgaos.length ? Promise.resolve(orgaos) : orgaosConcedentesApi.listar(),
    ]);
    setItens(convenios);
    setOrgaos(orgaosLista);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEsfera, filtroStatus, filtroOrgao]);

  function nomeOrgao(id: string) {
    return orgaos.find((o) => o.id === id)?.nome ?? '—';
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Convênios</h1>
        <Link
          href="/convenios/novo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo convênio
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
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
      </div>

      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 font-medium">Objeto</th>
                <th className="px-4 py-2 font-medium">Órgão</th>
                <th className="px-4 py-2 font-medium">Esfera</th>
                <th className="px-4 py-2 font-medium">Valor conveniado</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="max-w-md px-4 py-2">{item.objeto}</td>
                  <td className="px-4 py-2">{nomeOrgao(item.orgaoConcedenteId)}</td>
                  <td className="px-4 py-2">{ROTULOS_ESFERA_CONVENIO[item.esfera]}</td>
                  <td className="px-4 py-2">{formatarMoeda(item.valorConveniado)}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${CORES_BADGE[COR_STATUS_GERAL_CONVENIO[item.statusGeral]]}`}>
                      {ROTULOS_STATUS_GERAL_CONVENIO[item.statusGeral]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/convenios/${item.id}`} className="text-blue-600 hover:underline">
                      Ver/editar
                    </Link>
                  </td>
                </tr>
              ))}
              {itens.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                    Nenhum convênio encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
