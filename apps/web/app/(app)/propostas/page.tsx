'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ModalConfirmacaoExclusao } from '@jconv/compartilhado/componentes';
import { ROTULOS_STATUS_PROPOSTA, type OrgaoConcedente, type Proposta } from '@jconv/compartilhado';
import { orgaosConcedentesApi, propostasApi } from '../../../lib/api/recursos';

export default function PaginaPropostas() {
  const [itens, setItens] = useState<Proposta[]>([]);
  const [orgaos, setOrgaos] = useState<OrgaoConcedente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [paraExcluir, setParaExcluir] = useState<Proposta | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  async function carregar() {
    setCarregando(true);
    const [propostas, orgaosLista] = await Promise.all([propostasApi.listar(), orgaosConcedentesApi.listar()]);
    setItens(propostas);
    setOrgaos(orgaosLista);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    setExcluindo(true);
    try {
      await propostasApi.excluir(paraExcluir.id);
      setParaExcluir(null);
      await carregar();
    } finally {
      setExcluindo(false);
    }
  }

  function nomeOrgao(id: string) {
    return orgaos.find((o) => o.id === id)?.nome ?? '—';
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Propostas</h1>
        <Link
          href="/propostas/novo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nova proposta
        </Link>
      </div>

      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 font-medium">Objeto</th>
                <th className="px-4 py-2 font-medium">Órgão</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="max-w-md px-4 py-2">{item.objeto}</td>
                  <td className="px-4 py-2">{nomeOrgao(item.orgaoConcedenteId)}</td>
                  <td className="px-4 py-2">
                    {ROTULOS_STATUS_PROPOSTA[item.status]}
                    {item.convenioGeradoId && (
                      <Link href={`/convenios/${item.convenioGeradoId}`} className="ml-2 text-blue-600 hover:underline">
                        (ver convênio)
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/propostas/${item.id}`} className="mr-3 text-blue-600 hover:underline">
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
                  <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                    Nenhuma proposta cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {paraExcluir && (
        <ModalConfirmacaoExclusao
          nomeRegistro={paraExcluir.objeto}
          aoConfirmar={confirmarExclusao}
          aoCancelar={() => setParaExcluir(null)}
          excluindo={excluindo}
        />
      )}
    </div>
  );
}
