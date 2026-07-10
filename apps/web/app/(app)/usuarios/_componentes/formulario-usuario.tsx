'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarraAcoesFormulario } from '@jconv/compartilhado/componentes';
import { PAPEIS_USUARIO, ROTULOS_PAPEL_USUARIO, type OrgaoConcedente, type Usuario } from '@jconv/compartilhado';
import { orgaosConcedentesApi, usuariosApi } from '../../../../lib/api/recursos';
import { chamarApi } from '../../../../lib/api/cliente';

export interface FormularioUsuarioProps {
  usuario?: Usuario;
}

export function FormularioUsuario({ usuario }: FormularioUsuarioProps) {
  const roteador = useRouter();
  const [orgaos, setOrgaos] = useState<OrgaoConcedente[]>([]);
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [papel, setPapel] = useState(usuario?.papel ?? PAPEIS_USUARIO[0]);
  const [orgaosSelecionados, setOrgaosSelecionados] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    orgaosConcedentesApi.listar().then(setOrgaos);
    if (usuario) {
      chamarApi<{ orgaoConcedenteId: string }[]>(`/usuarios/${usuario.id}/orgaos`).then((vinculos) =>
        setOrgaosSelecionados(vinculos.map((v) => v.orgaoConcedenteId)),
      );
    }
  }, [usuario]);

  function alternarOrgao(orgaoId: string) {
    setOrgaosSelecionados((atual) =>
      atual.includes(orgaoId) ? atual.filter((id) => id !== orgaoId) : [...atual, orgaoId],
    );
  }

  async function aoSalvar() {
    setErro(null);
    setSalvando(true);
    try {
      if (usuario) {
        await usuariosApi.atualizar(usuario.id, { nome, papel, orgaosConcedentesIds: orgaosSelecionados });
      } else {
        await usuariosApi.criar({ nome, email, papel, orgaosConcedentesIds: orgaosSelecionados });
      }
      roteador.push('/usuarios');
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
        <label className="block text-sm font-medium">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!!usuario}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800"
        />
        {!usuario && (
          <p className="mt-1 text-xs text-neutral-500">
            Um convite será enviado a este e-mail — o usuário define a própria senha pelo link recebido.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Papel</label>
        <select
          value={papel}
          onChange={(e) => setPapel(e.target.value as typeof papel)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          {PAPEIS_USUARIO.map((v) => (
            <option key={v} value={v}>
              {ROTULOS_PAPEL_USUARIO[v]}
            </option>
          ))}
        </select>
      </div>

      {papel === 'LeituraSecretario' && (
        <div>
          <label className="block text-sm font-medium">Órgãos concedentes (escopo de leitura)</label>
          <div className="mt-1 max-h-48 space-y-1 overflow-y-auto rounded-md border border-neutral-300 p-2 dark:border-neutral-700">
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
        </div>
      )}

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <BarraAcoesFormulario
        aoVoltar={() => roteador.push('/usuarios')}
        aoCancelar={() => roteador.push('/usuarios')}
        aoSalvar={aoSalvar}
        salvando={salvando}
        formularioSujo={nome !== (usuario?.nome ?? '')}
        desabilitarSalvar={!nome || (!usuario && !email)}
      />
    </div>
  );
}
