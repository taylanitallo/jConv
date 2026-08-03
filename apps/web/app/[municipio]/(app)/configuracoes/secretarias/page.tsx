'use client';

import { useEffect, useState } from 'react';
import { ModalConfirmacaoExclusao } from '@jconv/compartilhado/componentes';
import type { OrgaoConcedente, Secretaria } from '@jconv/compartilhado';
import { orgaosConcedentesApi, secretariasApi } from '@/lib/api/recursos';
import { FormularioSecretaria } from './_componentes/formulario-secretaria';

export default function AbaSecretarias() {
  const [itens, setItens] = useState<Secretaria[]>([]);
  const [orgaos, setOrgaos] = useState<OrgaoConcedente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [emEdicao, setEmEdicao] = useState<Secretaria | 'nova' | null>(null);
  const [paraExcluir, setParaExcluir] = useState<Secretaria | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  async function carregar() {
    setCarregando(true);
    const [lista, listaOrgaos] = await Promise.all([secretariasApi.listar(), orgaosConcedentesApi.listar()]);
    setItens(lista);
    setOrgaos(listaOrgaos);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function excluir() {
    if (!paraExcluir) return;
    setExcluindo(true);
    try {
      await secretariasApi.excluir(paraExcluir.id);
      setParaExcluir(null);
      await carregar();
    } finally {
      setExcluindo(false);
    }
  }

  if (emEdicao) {
    return (
      <FormularioSecretaria
        secretaria={emEdicao === 'nova' ? undefined : emEdicao}
        orgaos={orgaos}
        aoSair={() => setEmEdicao(null)}
        aoSalvar={async () => {
          setEmEdicao(null);
          await carregar();
        }}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Secretarias do município. Os órgãos vinculados a cada uma definem o que os usuários com perfil
          &ldquo;Leitura Secretário&rdquo; conseguem enxergar.
        </p>
        <button
          type="button"
          onClick={() => setEmEdicao('nova')}
          className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nova secretaria
        </button>
      </div>

      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Sigla</th>
                <th className="px-4 py-2 font-medium">Secretário(a)</th>
                <th className="px-4 py-2 font-medium">Contato</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="px-4 py-2">{item.nome}</td>
                  <td className="px-4 py-2">{item.sigla ?? '—'}</td>
                  <td className="px-4 py-2">{item.secretarioResponsavel ?? '—'}</td>
                  <td className="px-4 py-2">{item.contato ?? '—'}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        item.ativo
                          ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                          : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                      }`}
                    >
                      {item.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setEmEdicao(item)}
                      className="mr-3 text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setParaExcluir(item)}
                      className="text-red-600 hover:underline"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {itens.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                    Nenhuma secretaria cadastrada ainda.
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
          aoConfirmar={excluir}
          aoCancelar={() => setParaExcluir(null)}
          excluindo={excluindo}
        />
      )}
    </div>
  );
}
