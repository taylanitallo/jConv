export interface CartaoIndicadorProps {
  rotulo: string;
  valor: string;
  cor?: 'neutro' | 'bom' | 'atencao' | 'critico';
  /** Quando informado, o card vira botão e abre o detalhamento do indicador. */
  aoClicar?: () => void;
  /** Quantidade de convênios por trás do número, usada na dica de acessibilidade. */
  quantidadeDetalhes?: number;
}

const CORES: Record<NonNullable<CartaoIndicadorProps['cor']>, string> = {
  neutro: 'border-neutral-200 dark:border-neutral-800',
  bom: 'border-green-200 dark:border-green-900',
  atencao: 'border-amber-200 dark:border-amber-900',
  critico: 'border-red-200 dark:border-red-900',
};

const BASE = 'rounded-lg border bg-white p-4 shadow-sm dark:bg-neutral-900';

export function CartaoIndicador({
  rotulo,
  valor,
  cor = 'neutro',
  aoClicar,
  quantidadeDetalhes,
}: CartaoIndicadorProps) {
  const conteudo = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{rotulo}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{valor}</p>
    </>
  );

  // Sem handler o card continua sendo um bloco estático — nada de alvo de clique morto.
  if (!aoClicar) {
    return <div className={`${BASE} ${CORES[cor]}`}>{conteudo}</div>;
  }

  const semDetalhes = quantidadeDetalhes === 0;

  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={semDetalhes}
      aria-label={
        semDetalhes
          ? `${rotulo}: ${valor}. Nenhum convênio para detalhar.`
          : `${rotulo}: ${valor}. Abrir lista de convênios.`
      }
      className={`${BASE} ${CORES[cor]} w-full cursor-pointer text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm dark:focus-visible:ring-offset-neutral-950`}
    >
      {conteudo}
      {!semDetalhes && (
        <span className="mt-2 block text-xs font-medium text-blue-600 dark:text-blue-400">Ver detalhes →</span>
      )}
    </button>
  );
}
