'use client';

import { useEffect, useState } from 'react';
import { ModalConfirmacaoExclusao } from '@jconv/compartilhado/componentes';
import { TIPOS_REPASSE, ROTULOS_TIPO_REPASSE, type Repasse } from '@jconv/compartilhado';
import { repassesApi } from '../../../../lib/api/recursos';

export function AbaRepasses({ convenioId }: { convenioId: string }) {
  const [itens, setItens] = useState<Repasse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<Repasse | null>(null);

  const [tipo, setTipo] = useState(TIPOS_REPASSE[0]);
  const [data, setData] = useState('');
  const [valor, setValor] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    setItens(await repassesApi.listar(convenioId));
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convenioId]);

  async function adicionar() {
    setSalvando(true);
    try {
      await repassesApi.criar(convenioId, { tipo, data, valor: Number(valor) });
      setMostrarForm(false);
      setData('');
      setValor('');
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!paraExcluir) return;
    await repassesApi.excluir(convenioId, paraExcluir.id);
    setParaExcluir(null);
    await carregar();
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setMostrarForm((v) => !v)}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {mostrarForm ? 'Cancelar' : 'Adicionar repasse'}
        </button>
      </div>

      {mostrarForm && (
        <div className="mb-4 grid grid-cols-4 gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
          <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800">
            {TIPOS_REPASSE.map((v) => (
              <option key={v} value={v}>
                {ROTULOS_TIPO_REPASSE[v]}
              </option>
            ))}
          </select>
          <input placeholder="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
          <input placeholder="Valor" type="number" value={valor} onChange={(e) => setValor(e.target.value)} className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
          <button onClick={adicionar} disabled={salvando || !data || !valor} className="rounded-md bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      )}

      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando…</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Data</th>
              <th className="px-3 py-2 font-medium">Valor</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {itens.map((r) => (
              <tr key={r.id} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="px-3 py-2">{ROTULOS_TIPO_REPASSE[r.tipo]}</td>
                <td className="px-3 py-2">{r.data}</td>
                <td className="px-3 py-2">{r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setParaExcluir(r)} className="text-red-600 hover:underline">
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-neutral-500">
                  Nenhum repasse registrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {paraExcluir && (
        <ModalConfirmacaoExclusao
          nomeRegistro={`Repasse de ${paraExcluir.data}`}
          aoConfirmar={excluir}
          aoCancelar={() => setParaExcluir(null)}
        />
      )}
    </div>
  );
}
