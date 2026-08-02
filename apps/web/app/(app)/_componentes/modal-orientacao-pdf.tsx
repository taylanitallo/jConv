'use client';

import { useEffect, useState } from 'react';
import { BotaoFecharJanela } from '@jconv/compartilhado/componentes';
import type { OrientacaoPdf } from '../../../lib/api/relatorios';

export interface ModalOrientacaoPdfProps {
  titulo: string;
  /** Sugestão inicial: relatórios com tabela larga abrem já em paisagem. */
  padrao?: OrientacaoPdf;
  aoConfirmar: (orientacao: OrientacaoPdf) => void;
  aoFechar: () => void;
}

const OPCOES: { valor: OrientacaoPdf; rotulo: string; descricao: string }[] = [
  { valor: 'retrato', rotulo: 'Vertical', descricao: 'A4 em pé — melhor para textos e listas curtas.' },
  { valor: 'paisagem', rotulo: 'Horizontal', descricao: 'A4 deitado — melhor para tabelas com muitas colunas.' },
];

export function ModalOrientacaoPdf({ titulo, padrao = 'retrato', aoConfirmar, aoFechar }: ModalOrientacaoPdfProps) {
  const [orientacao, setOrientacao] = useState<OrientacaoPdf>(padrao);

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') aoFechar();
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-orientacao-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
        <div className="flex items-start justify-between gap-3">
          <h2 id="modal-orientacao-titulo" className="text-lg font-semibold">
            {titulo}
          </h2>
          <BotaoFecharJanela aoFechar={aoFechar} />
        </div>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Escolha a orientação da página.</p>

        <fieldset className="mt-4 space-y-2">
          <legend className="sr-only">Orientação da página</legend>
          {OPCOES.map((opcao) => (
            <label
              key={opcao.valor}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                orientacao === opcao.valor
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40'
                  : 'border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800'
              }`}
            >
              <input
                type="radio"
                name="orientacao"
                value={opcao.valor}
                checked={orientacao === opcao.valor}
                onChange={() => setOrientacao(opcao.valor)}
                className="mt-1"
              />
              <span aria-hidden="true" className="mt-0.5 shrink-0">
                {opcao.valor === 'retrato' ? (
                  <svg viewBox="0 0 24 24" className="h-8 w-8 text-neutral-400" fill="none" stroke="currentColor">
                    <rect x="7" y="3" width="10" height="18" rx="1.5" strokeWidth="1.5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-8 w-8 text-neutral-400" fill="none" stroke="currentColor">
                    <rect x="3" y="7" width="18" height="10" rx="1.5" strokeWidth="1.5" />
                  </svg>
                )}
              </span>
              <span>
                <span className="block text-sm font-medium">{opcao.rotulo}</span>
                <span className="block text-xs text-neutral-500 dark:text-neutral-400">{opcao.descricao}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={aoFechar}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => aoConfirmar(orientacao)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Gerar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
