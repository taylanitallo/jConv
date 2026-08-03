/**
 * Vocabulário visual da administração do sistema, tirado da tela de login: fundo neutro, cartão
 * branco com borda suave, e o preto como cor de ação — não o azul do sistema do município.
 *
 * A diferença é proposital. Esta área não pertence a nenhuma prefeitura e mexe com todas ao
 * mesmo tempo; quando as duas telas se parecem demais, é fácil achar que se está configurando
 * um município quando na verdade se está mexendo em todos.
 *
 * Ficam num arquivo só para as quatro abas não divergirem com o tempo.
 */

export const CARTAO =
  'rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900';

/** Mesmo cartão, sem padding: para tabelas, que trazem o próprio espaçamento nas células. */
export const CARTAO_LISTA =
  'overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900';

export const BOTAO_PRIMARIO =
  'rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 ' +
  'disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white';

export const BOTAO_SECUNDARIO =
  'rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition ' +
  'hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 ' +
  'dark:hover:bg-neutral-800';

export const BOTAO_PERIGO =
  'rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50';

export const CAMPO =
  'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none transition ' +
  'focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-300';

export const ROTULO = 'mb-1 block text-sm font-medium';

export const CABECALHO_TABELA = 'bg-neutral-50 text-neutral-600 dark:bg-neutral-950 dark:text-neutral-400';

export const LINHA_TABELA = 'border-t border-neutral-200 dark:border-neutral-800';

export const ACAO_TABELA = 'font-medium text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-100';

export const AVISO_ERRO = 'mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700';

export const AVISO_SUCESSO = 'mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700';

export const RODAPE_EXPLICATIVO = 'mt-3 text-xs text-neutral-500';

export function etiqueta(ativo: boolean) {
  return ativo
    ? 'rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800'
    : 'rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200';
}
