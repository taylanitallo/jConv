'use client';

import { useEffect, useState } from 'react';
import { ModalConfirmacaoExclusao } from '@jconv/compartilhado/componentes';
import { TIPOS_ADITIVO, ROTULOS_TIPO_ADITIVO, type Aditivo } from '@jconv/compartilhado';
import { aditivosApi } from '../../../../lib/api/recursos';

export function AbaAditivos({ convenioId }: { convenioId: string }) {
  const [itens, setItens] = useState<Aditivo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<Aditivo | null>(null);

  const [tipo, setTipo] = useState(TIPOS_ADITIVO[0]);
  const [data, setData] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    setItens(await aditivosApi.listar(convenioId));
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convenioId]);

  async function adicionar() {
    setSalvando(true);
    try {
      await aditivosApi.criar(convenioId, { tipo, data, descricao });
      setMostrarForm(false);
      setData('');
      setDescricao('');
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!paraExcluir) return;
    await aditivosApi.excluir(convenioId, paraExcluir.id);
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
          {mostrarForm ? 'Cancelar' : 'Adicionar aditivo'}
        </button>
      </div>

      {mostrarForm && (
        <div className="mb-4 space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
          <div className="grid grid-cols-2 gap-2">
            <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800">
              {TIPOS_ADITIVO.map((v) => (
                <option key={v} value={v}>
                  {ROTULOS_TIPO_ADITIVO[v]}
                </option>
              ))}
            </select>
            <input placeholder="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
          </div>
          <textarea placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} className="w-full rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
          <button onClick={adicionar} disabled={salvando || !data || !descricao} className="rounded-md bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
            {salvando ? 'Salvando…' : 'Salvar aditivo'}
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
              <th className="px-3 py-2 font-medium">Descrição</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {itens.map((a) => (
              <tr key={a.id} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="px-3 py-2">{ROTULOS_TIPO_ADITIVO[a.tipo]}</td>
                <td className="px-3 py-2">{a.data}</td>
                <td className="max-w-md px-3 py-2">{a.descricao}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setParaExcluir(a)} className="text-red-600 hover:underline">
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-neutral-500">
                  Nenhum aditivo registrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {paraExcluir && (
        <ModalConfirmacaoExclusao
          nomeRegistro={`Aditivo de ${paraExcluir.data}`}
          aoConfirmar={excluir}
          aoCancelar={() => setParaExcluir(null)}
        />
      )}
    </div>
  );
}
