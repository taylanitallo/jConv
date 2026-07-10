'use client';

import { ModalConfirmacao } from './ModalConfirmacao';

export interface ModalConfirmacaoExclusaoProps {
  /** Identificação do registro exibida ao usuário, ex.: "Convênio nº 1234 — SEC. CIDADES" */
  nomeRegistro: string;
  aoConfirmar: () => void;
  aoCancelar: () => void;
  excluindo?: boolean;
}

// Padrão obrigatório (seção 3.2): toda exclusão do sistema passa por este modal antes de
// executar — nenhuma exclusão deve ocorrer direto ao clicar no ícone/botão de excluir.
export function ModalConfirmacaoExclusao({
  nomeRegistro,
  aoConfirmar,
  aoCancelar,
  excluindo = false,
}: ModalConfirmacaoExclusaoProps) {
  return (
    <ModalConfirmacao
      titulo="Confirmar exclusão"
      mensagem={
        <>
          Tem certeza que deseja excluir <strong>{nomeRegistro}</strong>? Esta ação não pode ser
          desfeita.
        </>
      }
      rotuloConfirmar="Confirmar exclusão"
      rotuloCancelar="Cancelar"
      variante="perigo"
      aoConfirmar={aoConfirmar}
      aoCancelar={aoCancelar}
      confirmando={excluindo}
    />
  );
}
