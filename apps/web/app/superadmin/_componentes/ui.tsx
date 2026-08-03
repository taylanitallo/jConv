'use client';

import type { LucideIcon } from 'lucide-react';

/**
 * Peças visuais do painel. A estrutura acompanha o jProcesso; as cores são as do jConv —
 * preto, branco e cinza.
 *
 * Cor só aparece onde carrega significado, nunca como enfeite: vermelho em erro e em ação
 * destrutiva. Um painel monocromático faz esses dois pontos saltarem justamente por serem os
 * únicos coloridos na tela.
 */

/** Quadrado com ícone. Invertido no escuro, senão o ícone branco sumiria sobre fundo claro. */
export const MARCA_ICONE = 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900';

const CORES_ETIQUETA = {
  ativo: 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900',
  neutra: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  erro: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
} as const;

export function Etiqueta({
  children,
  cor = 'neutra',
}: {
  children: React.ReactNode;
  cor?: keyof typeof CORES_ETIQUETA;
}) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${CORES_ETIQUETA[cor]}`}>
      {children}
    </span>
  );
}

/** Cartão de número. Sem cor: o que distingue um do outro é o rótulo e o ícone. */
export function Indicador({ rotulo, valor, Icone }: { rotulo: string; valor: number | string; Icone?: LucideIcon }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-1 flex items-center gap-2 text-neutral-500">
        {Icone && <Icone className="h-4 w-4" />}
        <p className="text-xs font-medium">{rotulo}</p>
      </div>
      <p className="text-2xl font-semibold tabular-nums">{valor}</p>
    </div>
  );
}

export function formatarData(valor?: string | null) {
  if (!valor) return '—';
  return new Date(valor).toLocaleString('pt-BR');
}

export function formatarDataCurta(valor?: string | null) {
  if (!valor) return '—';
  return new Date(valor).toLocaleDateString('pt-BR');
}

/** O identificador vira URL e nome de schema, então nasce sem acento, espaço ou maiúscula. */
export function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// ─── Classes reaproveitadas ───────────────────────────────────────────────────

export const BOTAO_PRIMARIO =
  'rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 ' +
  'disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white';

export const BOTAO_SECUNDARIO =
  'rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors ' +
  'hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900';

/** Vermelho aqui é aviso, não estilo: só em ação que substitui ou apaga dados. */
export const BOTAO_PERIGO =
  'rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50';

export const CAMPO =
  'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900';

export const ROTULO = 'mb-1 block text-sm font-medium';

export const CARTAO = 'rounded-lg border border-neutral-200 dark:border-neutral-800';

export const CABECALHO_TABELA = 'bg-neutral-50 dark:bg-neutral-900';

export const LINHA_TABELA = 'border-t border-neutral-200 dark:border-neutral-800';

export const ACAO_LINK = 'text-sm text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-100';

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];
