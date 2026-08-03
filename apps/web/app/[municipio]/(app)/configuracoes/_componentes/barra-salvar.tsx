'use client';

export function BarraSalvar({
  aoSalvar,
  salvando,
  erro,
  salvoAgora,
  desabilitado,
}: {
  aoSalvar: () => void;
  salvando: boolean;
  erro: string | null;
  salvoAgora: boolean;
  desabilitado?: boolean;
}) {
  return (
    <div className="mt-6 flex items-center gap-3">
      <button
        type="button"
        onClick={aoSalvar}
        disabled={salvando || desabilitado}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {salvando ? 'Salvando…' : 'Salvar'}
      </button>
      {erro && <span className="text-sm text-red-600">{erro}</span>}
      {salvoAgora && !erro && <span className="text-sm text-green-700 dark:text-green-400">Alterações salvas.</span>}
    </div>
  );
}
