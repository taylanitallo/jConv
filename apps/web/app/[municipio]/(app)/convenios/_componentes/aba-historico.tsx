'use client';

import { useEffect, useState } from 'react';
import type { ObservacaoConvenio } from '@jconv/compartilhado';
import { observacoesApi } from '@/lib/api/recursos';
import { abrirRelatorioHistoricoConvenio } from '@/lib/api/relatorios';
import { ModalOrientacaoPdf } from '../../_componentes/modal-orientacao-pdf';

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AbaHistorico({ convenioId }: { convenioId: string }) {
  const [itens, setItens] = useState<ObservacaoConvenio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [texto, setTexto] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [escolhendoOrientacao, setEscolhendoOrientacao] = useState(false);

  async function carregar() {
    setCarregando(true);
    setItens(await observacoesApi.listar(convenioId));
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convenioId]);

  async function registrar() {
    if (!texto.trim()) return;
    setErro(null);
    setSalvando(true);
    try {
      await observacoesApi.criar(convenioId, texto.trim());
      setTexto('');
      await carregar();
    } catch (excecao) {
      setErro(excecao instanceof Error ? excecao.message : 'Erro ao registrar observação');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      {/* print:hidden — ao imprimir, sai só o histórico, sem o formulário nem os botões. */}
      <div className="mb-4 rounded-md border border-neutral-200 p-3 print:hidden dark:border-neutral-800">
        <label htmlFor="nova-observacao" className="block text-sm font-medium">
          Nova observação
        </label>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          Cada registro é permanente: fica gravado com data, hora e autor, e não pode ser editado nem apagado. A
          observação mais recente é a que aparece nos relatórios do convênio.
        </p>
        <textarea
          id="nova-observacao"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
        {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={registrar}
            disabled={salvando || !texto.trim()}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {salvando ? 'Registrando…' : 'Registrar observação'}
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          {itens.length} {itens.length === 1 ? 'registro' : 'registros'}
        </h3>
        <div className="flex gap-2 print:hidden">
          <button
            type="button"
            onClick={() => setEscolhendoOrientacao(true)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Exportar PDF
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Imprimir
          </button>
        </div>
      </div>

      {escolhendoOrientacao && (
        <ModalOrientacaoPdf
          titulo="Exportar histórico do convênio"
          aoFechar={() => setEscolhendoOrientacao(false)}
          aoConfirmar={(orientacao) => {
            setEscolhendoOrientacao(false);
            abrirRelatorioHistoricoConvenio(convenioId, orientacao);
          }}
        />
      )}

      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando…</p>
      ) : itens.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
          Nenhuma observação registrada neste convênio ainda.
        </p>
      ) : (
        <ol className="space-y-3">
          {itens.map((item, indice) => (
            <li
              key={item.id}
              className="rounded-md border border-neutral-200 p-3 print:break-inside-avoid dark:border-neutral-800"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="font-medium tabular-nums">{formatarDataHora(item.criadoEm)}</span>
                <span>·</span>
                <span>{item.autorNome ?? 'autor não identificado'}</span>
                {indice === 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    mais recente — usada nos relatórios
                  </span>
                )}
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm">{item.texto}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
