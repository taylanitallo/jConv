'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ModalConfirmacaoExclusao } from '@jconv/compartilhado/componentes';
import type { EmpresaContratada } from '@jconv/compartilhado';
import { empresasContratadasApi } from '../../../lib/api/recursos';

export default function PaginaEmpresasContratadas() {
  const [empresas, setEmpresas] = useState<EmpresaContratada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [paraExcluir, setParaExcluir] = useState<EmpresaContratada | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  async function carregar() {
    setCarregando(true);
    setEmpresas(await empresasContratadasApi.listar());
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    setExcluindo(true);
    try {
      await empresasContratadasApi.excluir(paraExcluir.id);
      setParaExcluir(null);
      await carregar();
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Empresas Contratadas</h1>
        <Link
          href="/empresas-contratadas/novo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nova empresa
        </Link>
      </div>

      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Responsável/Contato</th>
                <th className="px-4 py-2 font-medium">CNPJ</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {empresas.map((empresa) => (
                <tr key={empresa.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="px-4 py-2">{empresa.nome}</td>
                  <td className="px-4 py-2">{empresa.responsavelContato ?? '—'}</td>
                  <td className="px-4 py-2">{empresa.cnpj ?? '—'}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/empresas-contratadas/${empresa.id}`} className="mr-3 text-blue-600 hover:underline">
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => setParaExcluir(empresa)}
                      className="text-red-600 hover:underline"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {empresas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                    Nenhuma empresa cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {paraExcluir && (
        <ModalConfirmacaoExclusao
          nomeRegistro={paraExcluir.nome}
          aoConfirmar={confirmarExclusao}
          aoCancelar={() => setParaExcluir(null)}
          excluindo={excluindo}
        />
      )}
    </div>
  );
}
