'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarraAcoesFormulario } from '@jconv/compartilhado/componentes';
import { PAPEIS_USUARIO, ROTULOS_PAPEL_USUARIO, type Secretaria, type Usuario } from '@jconv/compartilhado';
import { secretariasApi, usuariosApi } from '../../../../../lib/api/recursos';

export interface FormularioUsuarioProps {
  usuario?: Usuario;
}

export function FormularioUsuario({ usuario }: FormularioUsuarioProps) {
  const roteador = useRouter();
  const [secretarias, setSecretarias] = useState<Secretaria[]>([]);
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [papel, setPapel] = useState(usuario?.papel ?? PAPEIS_USUARIO[0]);
  const [secretariaId, setSecretariaId] = useState(usuario?.secretariaId ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    secretariasApi.listar().then(setSecretarias);
  }, []);

  async function aoSalvar() {
    setErro(null);
    setSalvando(true);
    try {
      if (usuario) {
        await usuariosApi.atualizar(usuario.id, { nome, papel, secretariaId: secretariaId || null });
      } else {
        await usuariosApi.criar({ nome, email, papel, secretariaId: secretariaId || null });
      }
      roteador.push('/configuracoes/usuarios');
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

      <div>
        <label className="block text-sm font-medium">Secretaria</label>
        <select
          value={secretariaId}
          onChange={(e) => setSecretariaId(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          <option value="">Nenhuma</option>
          {secretarias.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
        {papel === 'LeituraSecretario' && (
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Este perfil só enxerga os convênios dos órgãos vinculados à secretaria escolhida. Sem secretaria, não
            enxerga nenhum. Os órgãos de cada secretaria são definidos na aba Secretarias.
          </p>
        )}
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <BarraAcoesFormulario
        aoVoltar={() => roteador.push('/configuracoes/usuarios')}
        aoCancelar={() => roteador.push('/configuracoes/usuarios')}
        aoSalvar={aoSalvar}
        salvando={salvando}
        formularioSujo={nome !== (usuario?.nome ?? '')}
        desabilitarSalvar={!nome || (!usuario && !email)}
      />
    </div>
  );
}
