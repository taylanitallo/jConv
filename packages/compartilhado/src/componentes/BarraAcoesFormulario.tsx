'use client';

import { useState } from 'react';
import { ModalConfirmacao } from './ModalConfirmacao';

export interface BarraAcoesFormularioProps {
  aoVoltar: () => void;
  aoCancelar: () => void;
  aoSalvar: () => void;
  /** Formulário tem alterações não salvas — exibe confirmação antes de descartar no Cancelar */
  formularioSujo?: boolean;
  salvando?: boolean;
  desabilitarSalvar?: boolean;
  rotuloSalvar?: string;
}

// Padrão obrigatório (seção 3.2) de toda tela de cadastro/edição: três botões fixos e
// distintos — Voltar (não altera nada), Cancelar (descarta alterações, com confirmação se
// houver dados não salvos) e Salvar (grava com validação prévia).
export function BarraAcoesFormulario({
  aoVoltar,
  aoCancelar,
  aoSalvar,
  formularioSujo = false,
  salvando = false,
  desabilitarSalvar = false,
  rotuloSalvar = 'Salvar',
}: BarraAcoesFormularioProps) {
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);

  function aoClicarCancelar() {
    if (formularioSujo) {
      setConfirmandoDescarte(true);
      return;
    }
    aoCancelar();
  }

  return (
    <>
      <div className="flex justify-between gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <button
          type="button"
          onClick={aoVoltar}
          className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Voltar
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={aoClicarCancelar}
            disabled={salvando}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={aoSalvar}
            disabled={salvando || desabilitarSalvar}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : rotuloSalvar}
          </button>
        </div>
      </div>

      {confirmandoDescarte && (
        <ModalConfirmacao
          titulo="Descartar alterações?"
          mensagem="Você tem alterações não salvas neste formulário. Se continuar, elas serão perdidas."
          rotuloConfirmar="Descartar alterações"
          rotuloCancelar="Voltar ao formulário"
          variante="perigo"
          aoConfirmar={() => {
            setConfirmandoDescarte(false);
            aoCancelar();
          }}
          aoCancelar={() => setConfirmandoDescarte(false)}
        />
      )}
    </>
  );
}
