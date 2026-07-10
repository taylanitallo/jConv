'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BarraAcoesFormulario } from '@jconv/compartilhado/componentes';
import { ESFERAS_CONVENIO, ROTULOS_ESFERA_CONVENIO, type OrgaoConcedente } from '@jconv/compartilhado';
import { orgaosConcedentesApi } from '../../../../lib/api/recursos';

export interface FormularioOrgaoConcedenteProps {
  orgao?: OrgaoConcedente;
}

export function FormularioOrgaoConcedente({ orgao }: FormularioOrgaoConcedenteProps) {
  const roteador = useRouter();
  const [nome, setNome] = useState(orgao?.nome ?? '');
  const [esfera, setEsfera] = useState(orgao?.esfera ?? ESFERAS_CONVENIO[0]);
  const [parlamentarPadrinho, setParlamentarPadrinho] = useState(orgao?.parlamentarPadrinho ?? '');
  const [contato, setContato] = useState(orgao?.contato ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoSalvar() {
    setErro(null);
    setSalvando(true);
    try {
      const dados = { nome, esfera, parlamentarPadrinho: parlamentarPadrinho || null, contato: contato || null };
      if (orgao) {
        await orgaosConcedentesApi.atualizar(orgao.id, dados);
      } else {
        await orgaosConcedentesApi.criar(dados);
      }
      roteador.push('/orgaos-concedentes');
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
        <label className="block text-sm font-medium">Nome</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Esfera</label>
        <select
          value={esfera}
          onChange={(e) => setEsfera(e.target.value as typeof esfera)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          {ESFERAS_CONVENIO.map((valor) => (
            <option key={valor} value={valor}>
              {ROTULOS_ESFERA_CONVENIO[valor]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Parlamentar/Padrinho</label>
        <input
          value={parlamentarPadrinho}
          onChange={(e) => setParlamentarPadrinho(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Contato</label>
        <input
          value={contato}
          onChange={(e) => setContato(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <BarraAcoesFormulario
        aoVoltar={() => roteador.push('/orgaos-concedentes')}
        aoCancelar={() => roteador.push('/orgaos-concedentes')}
        aoSalvar={aoSalvar}
        salvando={salvando}
        formularioSujo={nome !== (orgao?.nome ?? '')}
      />
    </div>
  );
}
