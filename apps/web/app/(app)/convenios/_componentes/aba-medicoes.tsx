'use client';

import { useEffect, useState } from 'react';
import { ModalConfirmacaoExclusao } from '@jconv/compartilhado/componentes';
import { STATUS_MEDICAO, ROTULOS_STATUS_MEDICAO, type Medicao } from '@jconv/compartilhado';
import { medicoesApi } from '../../../../lib/api/recursos';

export function AbaMedicoes({ convenioId }: { convenioId: string }) {
  const [itens, setItens] = useState<Medicao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<Medicao | null>(null);

  const [numeroMedicao, setNumeroMedicao] = useState('');
  const [data, setData] = useState('');
  const [percentualAcumulado, setPercentualAcumulado] = useState('');
  const [valorPago, setValorPago] = useState('');
  const [valorAPagar, setValorAPagar] = useState('');
  const [status, setStatus] = useState(STATUS_MEDICAO[0]);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    setItens(await medicoesApi.listar(convenioId));
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convenioId]);

  async function adicionar() {
    setSalvando(true);
    try {
      await medicoesApi.criar(convenioId, {
        numeroMedicao: Number(numeroMedicao),
        data,
        percentualAcumulado: percentualAcumulado ? Number(percentualAcumulado) : null,
        valorPago: valorPago ? Number(valorPago) : null,
        valorAPagar: valorAPagar ? Number(valorAPagar) : null,
        status,
      });
      setMostrarForm(false);
      setNumeroMedicao('');
      setData('');
      setPercentualAcumulado('');
      setValorPago('');
      setValorAPagar('');
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!paraExcluir) return;
    await medicoesApi.excluir(convenioId, paraExcluir.id);
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
          {mostrarForm ? 'Cancelar' : 'Adicionar medição'}
        </button>
      </div>

      {mostrarForm && (
        <div className="mb-4 grid grid-cols-5 gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
          <input placeholder="Nº" type="number" value={numeroMedicao} onChange={(e) => setNumeroMedicao(e.target.value)} className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
          <input placeholder="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
          <input placeholder="% acumulado" type="number" value={percentualAcumulado} onChange={(e) => setPercentualAcumulado(e.target.value)} className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
          <input placeholder="Valor pago" type="number" value={valorPago} onChange={(e) => setValorPago(e.target.value)} className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
          <input placeholder="Valor a pagar" type="number" value={valorAPagar} onChange={(e) => setValorAPagar(e.target.value)} className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="col-span-2 rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800">
            {STATUS_MEDICAO.map((v) => (
              <option key={v} value={v}>
                {ROTULOS_STATUS_MEDICAO[v]}
              </option>
            ))}
          </select>
          <button onClick={adicionar} disabled={salvando || !numeroMedicao || !data} className="col-span-3 rounded-md bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
            {salvando ? 'Salvando…' : 'Salvar medição'}
          </button>
        </div>
      )}

      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando…</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2 font-medium">Nº</th>
              <th className="px-3 py-2 font-medium">Data</th>
              <th className="px-3 py-2 font-medium">% acumulado</th>
              <th className="px-3 py-2 font-medium">Valor pago</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {itens.map((m) => (
              <tr key={m.id} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="px-3 py-2">{m.numeroMedicao}</td>
                <td className="px-3 py-2">{m.data}</td>
                <td className="px-3 py-2">{m.percentualAcumulado ?? '—'}</td>
                <td className="px-3 py-2">{m.valorPago ?? '—'}</td>
                <td className="px-3 py-2">{ROTULOS_STATUS_MEDICAO[m.status]}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setParaExcluir(m)} className="text-red-600 hover:underline">
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-neutral-500">
                  Nenhuma medição registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {paraExcluir && (
        <ModalConfirmacaoExclusao
          nomeRegistro={`Medição nº ${paraExcluir.numeroMedicao}`}
          aoConfirmar={excluir}
          aoCancelar={() => setParaExcluir(null)}
        />
      )}
    </div>
  );
}
