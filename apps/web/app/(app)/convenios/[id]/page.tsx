'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ModalConfirmacaoExclusao } from '@jconv/compartilhado/componentes';
import type { Convenio } from '@jconv/compartilhado';
import { convenioApi } from '../../../../lib/api/recursos';
import { FormularioConvenio } from '../_componentes/formulario-convenio';
import { AbaMedicoes } from '../_componentes/aba-medicoes';
import { AbaRepasses } from '../_componentes/aba-repasses';
import { AbaAditivos } from '../_componentes/aba-aditivos';
import { AbaDocumentos } from '../_componentes/aba-documentos';

const ABAS = ['Dados Gerais', 'Medições', 'Repasses', 'Aditivos', 'Documentos'] as const;

export default function PaginaEditarConvenio() {
  const { id } = useParams<{ id: string }>();
  const roteador = useRouter();
  const [convenio, setConvenio] = useState<Convenio | null>(null);
  const [aba, setAba] = useState<(typeof ABAS)[number]>('Dados Gerais');
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    convenioApi.obter(id).then(setConvenio);
  }, [id]);

  if (!convenio) return <p className="text-sm text-neutral-500">Carregando…</p>;

  async function excluir() {
    setExcluindo(true);
    try {
      await convenioApi.excluir(id);
      roteador.push('/convenios');
      roteador.refresh();
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Convênio nº {convenio.numeroSequencial}</h1>
        <button
          type="button"
          onClick={() => setConfirmandoExclusao(true)}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
        >
          Excluir convênio
        </button>
      </div>

      <div className="mb-4 flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
        {ABAS.map((item) => (
          <button
            key={item}
            onClick={() => setAba(item)}
            className={
              aba === item
                ? 'border-b-2 border-blue-600 px-4 py-2 text-sm font-medium text-blue-600'
                : 'px-4 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }
          >
            {item}
          </button>
        ))}
      </div>

      {aba === 'Dados Gerais' && <FormularioConvenio convenio={convenio} />}
      {aba === 'Medições' && <AbaMedicoes convenioId={convenio.id} />}
      {aba === 'Repasses' && <AbaRepasses convenioId={convenio.id} />}
      {aba === 'Aditivos' && <AbaAditivos convenioId={convenio.id} />}
      {aba === 'Documentos' && <AbaDocumentos convenioId={convenio.id} />}

      {confirmandoExclusao && (
        <ModalConfirmacaoExclusao
          nomeRegistro={`Convênio nº ${convenio.numeroSequencial} — ${convenio.objeto}`}
          aoConfirmar={excluir}
          aoCancelar={() => setConfirmandoExclusao(false)}
          excluindo={excluindo}
        />
      )}
    </div>
  );
}
