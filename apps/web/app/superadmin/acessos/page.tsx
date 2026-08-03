'use client';

import { useEffect, useState } from 'react';
import { chamarSuperadmin, type Acesso, type ClienteMunicipio, type ResumoAcesso } from '@/lib/api/superadmin';

function formatarData(valor: string) {
  return new Date(valor).toLocaleString('pt-BR');
}

export default function PaginaAcessos() {
  const [clientes, setClientes] = useState<ClienteMunicipio[]>([]);
  const [slug, setSlug] = useState('');
  const [dias, setDias] = useState(30);
  const [resumo, setResumo] = useState<ResumoAcesso[]>([]);
  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    chamarSuperadmin<ClienteMunicipio[]>('/clientes').then(setClientes).catch(() => undefined);
  }, []);

  useEffect(() => {
    setCarregando(true);
    setErro(null);
    const filtro = slug ? `&municipio=${slug}` : '';
    Promise.all([
      chamarSuperadmin<ResumoAcesso[]>(`/acessos/resumo?dias=${dias}`),
      chamarSuperadmin<Acesso[]>(`/acessos?dias=${dias}${filtro}`),
    ])
      .then(([r, a]) => {
        setResumo(r);
        setAcessos(a);
      })
      .catch((e) => setErro((e as Error).message))
      .finally(() => setCarregando(false));
  }, [slug, dias]);

  function exportarCsv() {
    const cabecalho = ['Data', 'E-mail', 'Município', 'Resultado', 'Motivo', 'IP'];
    const linhas = acessos.map((a) => [
      formatarData(a.criado_em),
      a.email,
      a.cliente_slug ?? '',
      a.sucesso ? 'Entrou' : 'Falhou',
      a.motivo ?? '',
      a.ip ?? '',
    ]);
    // Ponto e vírgula e BOM: é o que o Excel em português abre sem pedir importação.
    const csv = '﻿' + [cabecalho, ...linhas].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `acessos-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Relatório de acesso</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">Todos os municípios</option>
            {clientes.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nomeMunicipio}/{c.uf}
              </option>
            ))}
          </select>
          <select
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value={7}>7 dias</option>
            <option value={30}>30 dias</option>
            <option value={90}>90 dias</option>
            <option value={365}>1 ano</option>
          </select>
          <button
            type="button"
            onClick={exportarCsv}
            disabled={!acessos.length}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {erro && <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{erro}</p>}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {resumo.map((r) => (
          <div key={r.cliente_slug ?? 'sem'} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="font-mono text-xs text-neutral-500">/{r.cliente_slug ?? '—'}</p>
            <p className="mt-1 text-2xl font-semibold">{r.entradas}</p>
            <p className="text-xs text-neutral-500">
              entradas · {r.usuarios_distintos} usuário(s) · {r.falhas} falha(s)
            </p>
          </div>
        ))}
        {!carregando && resumo.length === 0 && (
          <p className="text-sm text-neutral-500">Nenhum acesso registrado no período.</p>
        )}
      </div>

      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 font-medium">E-mail</th>
                <th className="px-4 py-2 font-medium">Município</th>
                <th className="px-4 py-2 font-medium">Resultado</th>
                <th className="px-4 py-2 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {acessos.map((acesso) => (
                <tr key={acesso.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="whitespace-nowrap px-4 py-2">{formatarData(acesso.criado_em)}</td>
                  <td className="px-4 py-2">{acesso.email}</td>
                  <td className="px-4 py-2 font-mono text-xs">{acesso.cliente_slug ?? '—'}</td>
                  <td className="px-4 py-2">
                    {acesso.sucesso ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">Entrou</span>
                    ) : (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-800" title={acesso.motivo ?? ''}>
                        {acesso.motivo ?? 'Falhou'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-neutral-500">{acesso.ip ?? '—'}</td>
                </tr>
              ))}
              {acessos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                    Nenhum acesso no período selecionado.
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
