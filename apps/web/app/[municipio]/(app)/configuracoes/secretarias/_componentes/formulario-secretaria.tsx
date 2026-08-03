'use client';

import { useState } from 'react';
import { BarraAcoesFormulario } from '@jconv/compartilhado/componentes';
import type { Secretaria } from '@jconv/compartilhado';
import { secretariasApi } from '@/lib/api/recursos';

const CAMPO =
  'mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800';
const ROTULO = 'block text-sm font-medium';

export interface FormularioSecretariaProps {
  secretaria?: Secretaria;
  aoSair: () => void;
  aoSalvar: () => void | Promise<void>;
}

// A secretaria guarda só o que a identifica. O secretário responsável passa a ser vínculo de
// usuário, e o alcance sobre convênios é decidido nas permissões do usuário e no cadastro do
// convênio — não por uma lista de órgãos pendurada aqui.
export function FormularioSecretaria({ secretaria, aoSair, aoSalvar }: FormularioSecretariaProps) {
  const [nome, setNome] = useState(secretaria?.nome ?? '');
  const [sigla, setSigla] = useState(secretaria?.sigla ?? '');
  const [ativo, setAtivo] = useState(secretaria?.ativo ?? true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    setErro(null);
    setSalvando(true);
    try {
      const dados = { nome, sigla: sigla || null, ativo };
      if (secretaria) {
        await secretariasApi.atualizar(secretaria.id, dados);
      } else {
        await secretariasApi.criar(dados);
      }
      await aoSalvar();
    } catch (excecao) {
      setErro(excecao instanceof Error ? excecao.message : 'Erro ao salvar');
      setSalvando(false);
    }
  }

  const sujo =
    nome !== (secretaria?.nome ?? '') ||
    sigla !== (secretaria?.sigla ?? '') ||
    ativo !== (secretaria?.ativo ?? true);

  return (
    <div className="max-w-2xl">
      <h2 className="mb-4 text-lg font-semibold">{secretaria ? 'Editar secretaria' : 'Nova secretaria'}</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_140px] gap-4">
          <div>
            <label className={ROTULO}>Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className={CAMPO} />
          </div>
          <div>
            <label className={ROTULO}>Sigla</label>
            <input value={sigla} onChange={(e) => setSigla(e.target.value)} className={CAMPO} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          Secretaria ativa
        </label>
      </div>

      {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

      <BarraAcoesFormulario
        aoVoltar={aoSair}
        aoCancelar={aoSair}
        aoSalvar={salvar}
        salvando={salvando}
        formularioSujo={sujo}
        desabilitarSalvar={!nome.trim()}
      />
    </div>
  );
}
