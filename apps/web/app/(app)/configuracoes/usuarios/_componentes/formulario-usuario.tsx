'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarraAcoesFormulario } from '@jconv/compartilhado/componentes';
import {
  MODULOS_SISTEMA,
  type MapaPermissoes,
  type Secretaria,
  type Usuario,
} from '@jconv/compartilhado';
import { secretariasApi, usuariosApi } from '../../../../../lib/api/recursos';
import { ModalAtribuicoes } from './modal-atribuicoes';

export interface FormularioUsuarioProps {
  usuario?: Usuario;
}

export function FormularioUsuario({ usuario }: FormularioUsuarioProps) {
  const roteador = useRouter();
  const [secretarias, setSecretarias] = useState<Secretaria[]>([]);
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [permissoes, setPermissoes] = useState<MapaPermissoes>({});
  const [editandoAtribuicoes, setEditandoAtribuicoes] = useState(false);
  const [secretariaId, setSecretariaId] = useState(usuario?.secretariaId ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    secretariasApi.listar().then(setSecretarias);
    if (usuario) {
      usuariosApi.listarPermissoes(usuario.id).then((linhas) =>
        setPermissoes(Object.fromEntries(linhas.map((p) => [p.modulo, p.nivel])) as MapaPermissoes),
      );
    }
  }, [usuario]);

  async function aoSalvar() {
    setErro(null);
    setSalvando(true);
    try {
      // As atribuições vão numa chamada própria porque o usuário só existe depois do convite —
      // no cadastro novo o id só aparece na resposta do criar.
      const alvo = usuario
        ? await usuariosApi.atualizar(usuario.id, { nome, secretariaId: secretariaId || null })
        : await usuariosApi.criar({ nome, email, secretariaId: secretariaId || null });

      await usuariosApi.definirPermissoes(
        alvo.id,
        MODULOS_SISTEMA.map((modulo) => ({ modulo, nivel: permissoes[modulo] ?? 'Nenhuma' })),
      );
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
        <label className="block text-sm font-medium">Atribuições</label>
        <button
          type="button"
          onClick={() => setEditandoAtribuicoes(true)}
          className="mt-1 flex w-full items-center justify-between rounded-md border border-neutral-300 px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          <span>
            {MODULOS_SISTEMA.filter((m) => (permissoes[m] ?? 'Nenhuma') !== 'Nenhuma').length} de {MODULOS_SISTEMA.length} telas liberadas
          </span>
          <span className="text-blue-600 dark:text-blue-400">Definir →</span>
        </button>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Sem permissão a tela nem aparece; parcial só permite consultar; total permite incluir, editar e excluir.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium">Secretaria</label>
        <select
          value={secretariaId}
          onChange={(e) => setSecretariaId(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          {/* Valor vazio = sem recorte por órgão. O rótulo diz "Todas" porque é isso que o
              comportamento significa — "Nenhuma" sugeriria o oposto do que acontece. */}
          <option value="">Todas as secretarias</option>
          {secretarias.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {secretariaId
            ? 'O usuário só enxerga os convênios dos órgãos vinculados a esta secretaria. Os órgãos de cada uma são definidos na aba Secretarias.'
            : 'O usuário enxerga os convênios de todos os órgãos. O que ele consegue fazer em cada tela continua sendo definido pelas Atribuições.'}
        </p>
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

      {editandoAtribuicoes && (
        <ModalAtribuicoes
          nomeUsuario={nome}
          valor={permissoes}
          aoFechar={() => setEditandoAtribuicoes(false)}
          aoConfirmar={(novas) => {
            setPermissoes(novas);
            setEditandoAtribuicoes(false);
          }}
        />
      )}
    </div>
  );
}
