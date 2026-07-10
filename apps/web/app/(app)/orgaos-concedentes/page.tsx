'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ModalConfirmacaoExclusao } from '@jconv/compartilhado/componentes';
import { ROTULOS_ESFERA_CONVENIO, type OrgaoConcedente } from '@jconv/compartilhado';
import { orgaosConcedentesApi } from '../../../lib/api/recursos';

export default function PaginaOrgaosConcedentes() {
  const [orgaos, setOrgaos] = useState<OrgaoConcedente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [paraExcluir, setParaExcluir] = useState<OrgaoConcedente | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  async function carregar() {
    setCarregando(true);
    setOrgaos(await orgaosConcedentesApi.listar());
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    setExcluindo(true);
    try {
      await orgaosConcedentesApi.excluir(paraExcluir.id);
      setParaExcluir(null);
      await carregar();
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Órgãos Concedentes</h1>
        <Link
          href="/orgaos-concedentes/novo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo órgão
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
                <th className="px-4 py-2 font-medium">Esfera</th>
                <th className="px-4 py-2 font-medium">Parlamentar/Padrinho</th>
                <th className="px-4 py-2 font-medium">Contato</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {orgaos.map((orgao) => (
                <tr key={orgao.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="px-4 py-2">{orgao.nome}</td>
                  <td className="px-4 py-2">{ROTULOS_ESFERA_CONVENIO[orgao.esfera]}</td>
                  <td className="px-4 py-2">{orgao.parlamentarPadrinho ?? '—'}</td>
                  <td className="px-4 py-2">{orgao.contato ?? '—'}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/orgaos-concedentes/${orgao.id}`} className="mr-3 text-blue-600 hover:underline">
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => setParaExcluir(orgao)}
                      className="text-red-600 hover:underline"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {orgaos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                    Nenhum órgão concedente cadastrado.
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
