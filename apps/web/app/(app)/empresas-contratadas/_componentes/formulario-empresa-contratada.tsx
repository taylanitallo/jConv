'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BarraAcoesFormulario } from '@jconv/compartilhado/componentes';
import type { EmpresaContratada } from '@jconv/compartilhado';
import { empresasContratadasApi } from '../../../../lib/api/recursos';

export interface FormularioEmpresaContratadaProps {
  empresa?: EmpresaContratada;
}

export function FormularioEmpresaContratada({ empresa }: FormularioEmpresaContratadaProps) {
  const roteador = useRouter();
  const [nome, setNome] = useState(empresa?.nome ?? '');
  const [responsavelContato, setResponsavelContato] = useState(empresa?.responsavelContato ?? '');
  const [cnpj, setCnpj] = useState(empresa?.cnpj ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoSalvar() {
    setErro(null);
    setSalvando(true);
    try {
      const dados = { nome, responsavelContato: responsavelContato || null, cnpj: cnpj || null };
      if (empresa) {
        await empresasContratadasApi.atualizar(empresa.id, dados);
      } else {
        await empresasContratadasApi.criar(dados);
      }
      roteador.push('/empresas-contratadas');
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
        <label className="block text-sm font-medium">Responsável/Contato</label>
        <input
          value={responsavelContato}
          onChange={(e) => setResponsavelContato(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">CNPJ</label>
        <input
          value={cnpj}
          onChange={(e) => setCnpj(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <BarraAcoesFormulario
        aoVoltar={() => roteador.push('/empresas-contratadas')}
        aoCancelar={() => roteador.push('/empresas-contratadas')}
        aoSalvar={aoSalvar}
        salvando={salvando}
        formularioSujo={nome !== (empresa?.nome ?? '')}
      />
    </div>
  );
}
