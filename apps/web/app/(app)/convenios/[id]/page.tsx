'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ModalConfirmacaoExclusao } from '@jconv/compartilhado/componentes';
import type { Convenio } from '@jconv/compartilhado';
import { convenioApi, iaApi } from '../../../../lib/api/recursos';
import { ErroApi } from '../../../../lib/api/cliente';
import { FormularioConvenio } from '../_componentes/formulario-convenio';
import { AbaMedicoes } from '../_componentes/aba-medicoes';
import { AbaRepasses } from '../_componentes/aba-repasses';
import { AbaAditivos } from '../_componentes/aba-aditivos';
import { AbaDocumentos } from '../_componentes/aba-documentos';
import { abrirRelatorioConvenio } from '../../../../lib/api/relatorios';

const ABAS = ['Dados Gerais', 'Medições', 'Repasses', 'Aditivos', 'Documentos'] as const;

export default function PaginaEditarConvenio() {
  const { id } = useParams<{ id: string }>();
  const roteador = useRouter();
  const [convenio, setConvenio] = useState<Convenio | null>(null);
  const [aba, setAba] = useState<(typeof ABAS)[number]>('Dados Gerais');
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [resumoIa, setResumoIa] = useState<string | null>(null);
  const [gerandoResumo, setGerandoResumo] = useState(false);
  const [erroResumo, setErroResumo] = useState<string | null>(null);

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

  async function gerarResumo() {
    setErroResumo(null);
    setGerandoResumo(true);
    try {
      const { resumo } = await iaApi.resumoConvenio(id);
      setResumoIa(resumo);
    } catch (excecao) {
      if (excecao instanceof ErroApi && excecao.status === 503) {
        setErroResumo('Assistente de IA ainda não configurado neste ambiente.');
      } else {
        setErroResumo(excecao instanceof Error ? excecao.message : 'Erro ao gerar resumo');
      }
    } finally {
      setGerandoResumo(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Convênio nº {convenio.numeroSequencial}</h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={gerarResumo}
            disabled={gerandoResumo}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {gerandoResumo ? 'Gerando…' : 'Resumo executivo (IA)'}
          </button>
          <button
            type="button"
            onClick={() => abrirRelatorioConvenio(convenio.id)}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Exportar PDF
          </button>
          <button
            type="button"
            onClick={() => setConfirmandoExclusao(true)}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
          >
            Excluir convênio
          </button>
        </div>
      </div>

      {erroResumo && <p className="mb-3 text-sm text-red-600">{erroResumo}</p>}
      {resumoIa && (
        <div className="mb-4 whitespace-pre-wrap rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
          {resumoIa}
        </div>
      )}

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
