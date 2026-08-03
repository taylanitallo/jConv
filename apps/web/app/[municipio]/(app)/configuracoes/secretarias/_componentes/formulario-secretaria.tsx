'use client';

import { useEffect, useState } from 'react';
import { BarraAcoesFormulario } from '@jconv/compartilhado/componentes';
import type { OrgaoConcedente, Secretaria } from '@jconv/compartilhado';
import { secretariasApi } from '@/lib/api/recursos';

const CAMPO =
  'mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800';
const ROTULO = 'block text-sm font-medium';

export interface FormularioSecretariaProps {
  secretaria?: Secretaria;
  orgaos: OrgaoConcedente[];
  aoSair: () => void;
  aoSalvar: () => void | Promise<void>;
}

export function FormularioSecretaria({ secretaria, orgaos, aoSair, aoSalvar }: FormularioSecretariaProps) {
  const [nome, setNome] = useState(secretaria?.nome ?? '');
  const [sigla, setSigla] = useState(secretaria?.sigla ?? '');
  const [responsavel, setResponsavel] = useState(secretaria?.secretarioResponsavel ?? '');
  const [contato, setContato] = useState(secretaria?.contato ?? '');
  const [ativo, setAtivo] = useState(secretaria?.ativo ?? true);
  const [orgaosSelecionados, setOrgaosSelecionados] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!secretaria) return;
    secretariasApi
      .listarOrgaos(secretaria.id)
      .then((vinculos) => setOrgaosSelecionados(vinculos.map((v) => v.orgaoConcedenteId)));
  }, [secretaria]);

  function alternarOrgao(orgaoId: string) {
    setOrgaosSelecionados((atual) =>
      atual.includes(orgaoId) ? atual.filter((id) => id !== orgaoId) : [...atual, orgaoId],
    );
  }

  async function salvar() {
    setErro(null);
    setSalvando(true);
    try {
      const dados = {
        nome,
        sigla: sigla || null,
        secretarioResponsavel: responsavel || null,
        contato: contato || null,
        ativo,
        orgaosConcedentesIds: orgaosSelecionados,
      };
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={ROTULO}>Secretário(a) responsável</label>
            <input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className={CAMPO} />
          </div>
          <div>
            <label className={ROTULO}>Contato</label>
            <input value={contato} onChange={(e) => setContato(e.target.value)} className={CAMPO} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          Secretaria ativa
        </label>

        <div>
          <label className={ROTULO}>Órgãos concedentes desta secretaria</label>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Define o escopo de leitura dos usuários com perfil &ldquo;Leitura Secretário&rdquo; vinculados a ela.
            Perfis Administrador, Gestor e Financeiro enxergam todos os órgãos, independente desta lista.
          </p>
          <div className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-md border border-neutral-300 p-2 dark:border-neutral-700">
            {orgaos.map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={orgaosSelecionados.includes(o.id)}
                  onChange={() => alternarOrgao(o.id)}
                />
                {o.nome}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {orgaosSelecionados.length} de {orgaos.length} selecionado(s)
          </p>
        </div>
      </div>

      {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

      <BarraAcoesFormulario
        aoVoltar={aoSair}
        aoCancelar={aoSair}
        aoSalvar={salvar}
        salvando={salvando}
        formularioSujo={nome !== (secretaria?.nome ?? '')}
        desabilitarSalvar={!nome.trim()}
      />
    </div>
  );
}
