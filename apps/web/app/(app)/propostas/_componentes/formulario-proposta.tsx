'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarraAcoesFormulario } from '@jconv/compartilhado/componentes';
import { STATUS_PROPOSTA, ROTULOS_STATUS_PROPOSTA, type OrgaoConcedente, type Proposta } from '@jconv/compartilhado';
import { orgaosConcedentesApi, propostasApi } from '../../../../lib/api/recursos';

export interface FormularioPropostaProps {
  proposta?: Proposta;
}

export function FormularioProposta({ proposta }: FormularioPropostaProps) {
  const roteador = useRouter();
  const [orgaos, setOrgaos] = useState<OrgaoConcedente[]>([]);
  const [orgaoConcedenteId, setOrgaoConcedenteId] = useState(proposta?.orgaoConcedenteId ?? '');
  const [objeto, setObjeto] = useState(proposta?.objeto ?? '');
  const [numeroProtocolo, setNumeroProtocolo] = useState(proposta?.numeroProtocolo ?? '');
  const [numeroNup, setNumeroNup] = useState(proposta?.numeroNup ?? '');
  const [status, setStatus] = useState(proposta?.status ?? STATUS_PROPOSTA[0]);
  const [observacoes, setObservacoes] = useState(proposta?.observacoes ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    orgaosConcedentesApi.listar().then(setOrgaos);
  }, []);

  const jaPromovida = !!proposta?.convenioGeradoId;

  async function aoSalvar() {
    setErro(null);
    setSalvando(true);
    try {
      const dados = {
        orgaoConcedenteId,
        objeto,
        numeroProtocolo: numeroProtocolo || null,
        numeroNup: numeroNup || null,
        status,
        observacoes: observacoes || null,
      };
      if (proposta) {
        await propostasApi.atualizar(proposta.id, dados);
      } else {
        await propostasApi.criar(dados);
      }
      roteador.push('/propostas');
      roteador.refresh();
    } catch (excecao) {
      setErro(excecao instanceof Error ? excecao.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium">Órgão concedente</label>
        <select
          value={orgaoConcedenteId}
          onChange={(e) => setOrgaoConcedenteId(e.target.value)}
          disabled={jaPromovida}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800"
        >
          <option value="">Selecione…</option>
          {orgaos.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Objeto</label>
        <textarea
          value={objeto}
          onChange={(e) => setObjeto(e.target.value)}
          rows={3}
          disabled={jaPromovida}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Nº Protocolo</label>
          <input
            value={numeroProtocolo}
            onChange={(e) => setNumeroProtocolo(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">NUP</label>
          <input
            value={numeroNup}
            onChange={(e) => setNumeroNup(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          disabled={jaPromovida}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800"
        >
          {STATUS_PROPOSTA.map((valor) => (
            <option key={valor} value={valor}>
              {ROTULOS_STATUS_PROPOSTA[valor]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Observações</label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {!jaPromovida && (
        <BarraAcoesFormulario
          aoVoltar={() => roteador.push('/propostas')}
          aoCancelar={() => roteador.push('/propostas')}
          aoSalvar={aoSalvar}
          salvando={salvando}
          formularioSujo={objeto !== (proposta?.objeto ?? '')}
          desabilitarSalvar={!orgaoConcedenteId || !objeto}
        />
      )}
    </div>
  );
}
