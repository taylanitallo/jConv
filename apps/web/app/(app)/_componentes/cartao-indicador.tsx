export interface CartaoIndicadorProps {
  rotulo: string;
  valor: string;
  cor?: 'neutro' | 'bom' | 'atencao' | 'critico';
}

const CORES: Record<NonNullable<CartaoIndicadorProps['cor']>, string> = {
  neutro: 'border-neutral-200 dark:border-neutral-800',
  bom: 'border-green-200 dark:border-green-900',
  atencao: 'border-amber-200 dark:border-amber-900',
  critico: 'border-red-200 dark:border-red-900',
};

export function CartaoIndicador({ rotulo, valor, cor = 'neutro' }: CartaoIndicadorProps) {
  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm dark:bg-neutral-900 ${CORES[cor]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{rotulo}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{valor}</p>
    </div>
  );
}
