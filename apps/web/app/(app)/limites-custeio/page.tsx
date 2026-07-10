'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ModalConfirmacaoExclusao } from '@jconv/compartilhado/componentes';
import { ROTULOS_TIPO_LIMITE_CUSTEIO, type LimiteCusteio } from '@jconv/compartilhado';
import { limitesCusteioApi } from '../../../lib/api/recursos';

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function PaginaLimitesCusteio() {
  const [itens, setItens] = useState<LimiteCusteio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [paraExcluir, setParaExcluir] = useState<LimiteCusteio | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  async function carregar() {
    setCarregando(true);
    setItens(await limitesCusteioApi.listar());
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    setExcluindo(true);
    try {
      await limitesCusteioApi.excluir(paraExcluir.id);
      setParaExcluir(null);
      await carregar();
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Limites de Custeio</h1>
        <Link
          href="/limites-custeio/novo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo limite
        </Link>
      </div>

      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 font-medium">Tipo</th>
                <th className="px-4 py-2 font-medium">Competência</th>
                <th className="px-4 py-2 font-medium">Teto</th>
                <th className="px-4 py-2 font-medium">Utilizado</th>
                <th className="px-4 py-2 font-medium">Saldo</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="px-4 py-2">{ROTULOS_TIPO_LIMITE_CUSTEIO[item.tipo]}</td>
                  <td className="px-4 py-2">{item.competenciaAno}</td>
                  <td className="px-4 py-2">{formatarMoeda(item.valorTeto)}</td>
                  <td className="px-4 py-2">{formatarMoeda(item.valorUtilizado)}</td>
                  <td className="px-4 py-2">{formatarMoeda(item.saldo)}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/limites-custeio/${item.id}`} className="mr-3 text-blue-600 hover:underline">
                      Editar
                    </Link>
                    <button type="button" onClick={() => setParaExcluir(item)} className="text-red-600 hover:underline">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {itens.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                    Nenhum limite de custeio cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {paraExcluir && (
        <ModalConfirmacaoExclusao
          nomeRegistro={`${ROTULOS_TIPO_LIMITE_CUSTEIO[paraExcluir.tipo]} ${paraExcluir.competenciaAno}`}
          aoConfirmar={confirmarExclusao}
          aoCancelar={() => setParaExcluir(null)}
          excluindo={excluindo}
        />
      )}
    </div>
  );
}
