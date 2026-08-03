// Tela mostrada quando o layout autenticado não consegue falar com a API. É um Server
// Component simples de propósito: o caso "API fora do ar" é justamente aquele em que não dá
// para contar com mais nada funcionando.
export function AvisoApiIndisponivel({ detalhe }: { detalhe: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-lg text-center">
        <h1 className="text-xl font-semibold">Servidor indisponível</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          O sistema não conseguiu falar com o servidor da API. Isso costuma ser temporário — recarregue a página em
          alguns instantes.
        </p>
        <p className="mt-4 break-words rounded-md bg-neutral-100 px-3 py-2 text-left text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
          {detalhe}
        </p>
      </div>
    </div>
  );
}
