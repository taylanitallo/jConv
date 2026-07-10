'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ROTULOS_PAPEL_USUARIO, type Usuario } from '@jconv/compartilhado';
import { usuariosApi } from '../../../lib/api/recursos';

export default function PaginaUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    setUsuarios(await usuariosApi.listar());
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function alternarAtivo(usuario: Usuario) {
    await usuariosApi.atualizar(usuario.id, { ativo: !usuario.ativo });
    await carregar();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Usuários</h1>
        <Link
          href="/usuarios/novo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo usuário
        </Link>
      </div>

      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">E-mail</th>
                <th className="px-4 py-2 font-medium">Papel</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="px-4 py-2">{u.nome}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{ROTULOS_PAPEL_USUARIO[u.papel]}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        u.ativo
                          ? 'rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300'
                          : 'rounded-full bg-neutral-200 px-2 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                      }
                    >
                      {u.ativo ? 'Ativo' : 'Desativado'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/usuarios/${u.id}`} className="mr-3 text-blue-600 hover:underline">
                      Editar
                    </Link>
                    <button type="button" onClick={() => alternarAtivo(u)} className="text-neutral-600 hover:underline dark:text-neutral-300">
                      {u.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
