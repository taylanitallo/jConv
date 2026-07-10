'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarraAcoesFormulario } from '@jconv/compartilhado/componentes';
import { TIPOS_LIMITE_CUSTEIO, ROTULOS_TIPO_LIMITE_CUSTEIO, type LimiteCusteio, type OrgaoConcedente } from '@jconv/compartilhado';
import { limitesCusteioApi, orgaosConcedentesApi } from '../../../../lib/api/recursos';

export interface FormularioLimiteCusteioProps {
  limite?: LimiteCusteio;
}

export function FormularioLimiteCusteio({ limite }: FormularioLimiteCusteioProps) {
  const roteador = useRouter();
  const [orgaos, setOrgaos] = useState<OrgaoConcedente[]>([]);
  const [orgaoConcedenteId, setOrgaoConcedenteId] = useState(limite?.orgaoConcedenteId ?? '');
  const [tipo, setTipo] = useState(limite?.tipo ?? TIPOS_LIMITE_CUSTEIO[0]);
  const [portariaReferencia, setPortariaReferencia] = useState(limite?.portariaReferencia ?? '');
  const [competenciaAno, setCompetenciaAno] = useState(limite?.competenciaAno ?? new Date().getFullYear());
  const [valorTeto, setValorTeto] = useState(limite?.valorTeto ?? 0);
  const [valorUtilizado, setValorUtilizado] = useState(limite?.valorUtilizado ?? 0);
  const [observacoes, setObservacoes] = useState(limite?.observacoes ?? '');
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
        tipo,
        portariaReferencia: portariaReferencia || null,
        competenciaAno,
        valorTeto,
        valorUtilizado,
        observacoes: observacoes || null,
      };
      if (limite) {
        await limitesCusteioApi.atualizar(limite.id, dados);
      } else {
        await limitesCusteioApi.criar(dados);
      }
      roteador.push('/limites-custeio');
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          >
            {TIPOS_LIMITE_CUSTEIO.map((valor) => (
              <option key={valor} value={valor}>
                {ROTULOS_TIPO_LIMITE_CUSTEIO[valor]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Competência (ano)</label>
          <input
            type="number"
            value={competenciaAno}
            onChange={(e) => setCompetenciaAno(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Portaria de referência</label>
        <input
          value={portariaReferencia}
          onChange={(e) => setPortariaReferencia(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Valor teto</label>
          <input
            type="number"
            step="0.01"
            value={valorTeto}
            onChange={(e) => setValorTeto(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Valor utilizado</label>
          <input
            type="number"
            step="0.01"
            value={valorUtilizado}
            onChange={(e) => setValorUtilizado(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
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
        aoVoltar={() => roteador.push('/limites-custeio')}
        aoCancelar={() => roteador.push('/limites-custeio')}
        aoSalvar={aoSalvar}
        salvando={salvando}
        formularioSujo={valorTeto !== (limite?.valorTeto ?? 0)}
        desabilitarSalvar={!orgaoConcedenteId}
      />
    </div>
  );
}
