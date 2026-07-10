'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarraAcoesFormulario } from '@jconv/compartilhado/componentes';
import { STATUS_CESSAO_TERRENO, ROTULOS_STATUS_CESSAO_TERRENO, type CessaoTerreno, type OrgaoConcedente } from '@jconv/compartilhado';
import { cessoesTerrenoApi, orgaosConcedentesApi } from '../../../../lib/api/recursos';

export interface FormularioCessaoTerrenoProps {
  cessao?: CessaoTerreno;
}

export function FormularioCessaoTerreno({ cessao }: FormularioCessaoTerrenoProps) {
  const roteador = useRouter();
  const [orgaos, setOrgaos] = useState<OrgaoConcedente[]>([]);
  const [orgaoConcedenteId, setOrgaoConcedenteId] = useState(cessao?.orgaoConcedenteId ?? '');
  const [objeto, setObjeto] = useState(cessao?.objeto ?? '');
  const [numeroProtocolo, setNumeroProtocolo] = useState(cessao?.numeroProtocolo ?? '');
  const [numeroNup, setNumeroNup] = useState(cessao?.numeroNup ?? '');
  const [responsavelInterno, setResponsavelInterno] = useState(cessao?.responsavelInterno ?? '');
  const [status, setStatus] = useState(cessao?.status ?? STATUS_CESSAO_TERRENO[0]);
  const [observacoes, setObservacoes] = useState(cessao?.observacoes ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    orgaosConcedentesApi.listar().then(setOrgaos);
  }, []);

  async function aoSalvar() {
    setErro(null);
    setSalvando(true);
    try {
      const dados = {
        orgaoConcedenteId,
        objeto,
        numeroProtocolo: numeroProtocolo || null,
        numeroNup: numeroNup || null,
        responsavelInterno: responsavelInterno || null,
        status,
        observacoes: observacoes || null,
      };
      if (cessao) {
        await cessoesTerrenoApi.atualizar(cessao.id, dados);
      } else {
        await cessoesTerrenoApi.criar(dados);
      }
      roteador.push('/cessoes-terreno');
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
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
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
        <label className="block text-sm font-medium">Objeto/Finalidade</label>
        <textarea
          value={objeto}
          onChange={(e) => setObjeto(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
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
        <label className="block text-sm font-medium">Responsável interno</label>
        <input
          value={responsavelInterno}
          onChange={(e) => setResponsavelInterno(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          {STATUS_CESSAO_TERRENO.map((valor) => (
            <option key={valor} value={valor}>
              {ROTULOS_STATUS_CESSAO_TERRENO[valor]}
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

      <BarraAcoesFormulario
        aoVoltar={() => roteador.push('/cessoes-terreno')}
        aoCancelar={() => roteador.push('/cessoes-terreno')}
        aoSalvar={aoSalvar}
        salvando={salvando}
        formularioSujo={objeto !== (cessao?.objeto ?? '')}
        desabilitarSalvar={!orgaoConcedenteId || !objeto}
      />
    </div>
  );
}
