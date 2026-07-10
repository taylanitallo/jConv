'use client';

export interface BotaoFecharJanelaProps {
  aoFechar: () => void;
  rotulo?: string;
}

// Padrão obrigatório (seção 3.2): toda janela, modal ou aba secundária precisa de um botão
// claro de voltar/fechar — nunca deixar o usuário "preso" numa tela sem saída óbvia.
export function BotaoFecharJanela({ aoFechar, rotulo = 'Fechar' }: BotaoFecharJanelaProps) {
  return (
    <button
      type="button"
      onClick={aoFechar}
      aria-label={rotulo}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
      </svg>
      {rotulo}
    </button>
  );
}
