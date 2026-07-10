'use client';

import { ReactNode } from 'react';

export interface ModalConfirmacaoProps {
  titulo: string;
  mensagem: ReactNode;
  rotuloConfirmar?: string;
  rotuloCancelar?: string;
  variante?: 'padrao' | 'perigo';
  aoConfirmar: () => void;
  aoCancelar: () => void;
  confirmando?: boolean;
}

// Base de todo modal de confirmação do sistema (ex.: ModalConfirmacaoExclusao, descarte de
// formulário não salvo). Nunca fecha sozinho ao clicar fora — só pelos botões, para evitar
// perda acidental de contexto.
export function ModalConfirmacao({
  titulo,
  mensagem,
  rotuloConfirmar = 'Confirmar',
  rotuloCancelar = 'Cancelar',
  variante = 'padrao',
  aoConfirmar,
  aoCancelar,
  confirmando = false,
}: ModalConfirmacaoProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-confirmacao-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
        <h2 id="modal-confirmacao-titulo" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {titulo}
        </h2>
        <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{mensagem}</div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={aoCancelar}
            disabled={confirmando}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {rotuloCancelar}
          </button>
          <button
            type="button"
            onClick={aoConfirmar}
            disabled={confirmando}
            className={
              variante === 'perigo'
                ? 'rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50'
                : 'rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'
            }
          >
            {confirmando ? 'Aguarde…' : rotuloConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
