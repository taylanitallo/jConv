'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TIPOS_INSTRUMENTO, ROTULOS_TIPO_INSTRUMENTO, type Proposta } from '@jconv/compartilhado';
import { propostasExtra } from '../../../../lib/api/recursos';

export interface ModalPromoverPropostaProps {
  proposta: Proposta;
  aoFechar: () => void;
}

export function ModalPromoverProposta({ proposta, aoFechar }: ModalPromoverPropostaProps) {
  const roteador = useRouter();
  const [tipoInstrumento, setTipoInstrumento] = useState(TIPOS_INSTRUMENTO[0]);
  const [valorConveniado, setValorConveniado] = useState('');
  const [valorConcedido, setValorConcedido] = useState('');
  const [valorContrapartida, setValorContrapartida] = useState('');
  const [numeroConvenio, setNumeroConvenio] = useState('');
  const [numeroMapp, setNumeroMapp] = useState('');
  const [numeroSic, setNumeroSic] = useState('');
  const [dataAssinatura, setDataAssinatura] = useState('');
  const [dataInicioVigencia, setDataInicioVigencia] = useState('');
  const [dataFimVigencia, setDataFimVigencia] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoConfirmar() {
    setErro(null);
    setEnviando(true);
    try {
      const { convenioId } = await propostasExtra.promover(proposta.id, {
        tipoInstrumento,
        valorConveniado: valorConveniado ? Number(valorConveniado) : null,
        valorConcedido: valorConcedido ? Number(valorConcedido) : null,
        valorContrapartida: valorContrapartida ? Number(valorContrapartida) : null,
        numeroConvenio: numeroConvenio || null,
        numeroMapp: numeroMapp || null,
        numeroSic: numeroSic || null,
        dataAssinatura: dataAssinatura || null,
        dataInicioVigencia: dataInicioVigencia || null,
        dataFimVigencia: dataFimVigencia || null,
      });
      roteador.push(`/convenios/${convenioId}`);
      roteador.refresh();
    } catch (excecao) {
      setErro(excecao instanceof Error ? excecao.message : 'Erro ao promover proposta');
      setEnviando(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
        <h2 className="text-lg font-semibold">Promover proposta a Convênio</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Objeto, protocolo/NUP e órgão são reaproveitados automaticamente da proposta. Preencha só os campos que
          só existem no Convênio.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium">Tipo de instrumento</label>
            <select
              value={tipoInstrumento}
              onChange={(e) => setTipoInstrumento(e.target.value as typeof tipoInstrumento)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            >
              {TIPOS_INSTRUMENTO.map((valor) => (
                <option key={valor} value={valor}>
                  {ROTULOS_TIPO_INSTRUMENTO[valor]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">Valor conveniado</label>
              <input
                type="number"
                value={valorConveniado}
                onChange={(e) => setValorConveniado(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Valor concedido</label>
              <input
                type="number"
                value={valorConcedido}
                onChange={(e) => setValorConcedido(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Contrapartida</label>
              <input
                type="number"
                value={valorContrapartida}
                onChange={(e) => setValorContrapartida(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">Nº Convênio</label>
              <input
                value={numeroConvenio}
                onChange={(e) => setNumeroConvenio(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Nº MAPP</label>
              <input
                value={numeroMapp}
                onChange={(e) => setNumeroMapp(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Nº SIC</label>
              <input
                value={numeroSic}
                onChange={(e) => setNumeroSic(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">Assinatura</label>
              <input
                type="date"
                value={dataAssinatura}
                onChange={(e) => setDataAssinatura(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Início vigência</label>
              <input
                type="date"
                value={dataInicioVigencia}
                onChange={(e) => setDataInicioVigencia(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Fim vigência</label>
              <input
                type="date"
                value={dataFimVigencia}
                onChange={(e) => setDataFimVigencia(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
          </div>
        </div>

        {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={aoFechar}
            disabled={enviando}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={aoConfirmar}
            disabled={enviando}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {enviando ? 'Promovendo…' : 'Promover a Convênio'}
          </button>
        </div>
      </div>
    </div>
  );
}
