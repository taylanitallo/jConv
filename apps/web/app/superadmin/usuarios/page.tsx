'use client';

import { useEffect, useState } from 'react';
import { chamarSuperadmin, type ClienteMunicipio, type UsuarioDoMunicipio } from '@/lib/api/superadmin';

export default function PaginaUsuariosPorMunicipio() {
  const [clientes, setClientes] = useState<ClienteMunicipio[]>([]);
  const [slug, setSlug] = useState('');
  const [usuarios, setUsuarios] = useState<UsuarioDoMunicipio[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    chamarSuperadmin<ClienteMunicipio[]>('/clientes')
      .then((lista) => {
        setClientes(lista);
        if (lista.length) setSlug(lista[0].slug);
      })
      .catch((e) => setErro((e as Error).message));
  }, []);

  useEffect(() => {
    if (!slug) return;
    setCarregando(true);
    setErro(null);
    chamarSuperadmin<UsuarioDoMunicipio[]>(`/clientes/${slug}/usuarios`)
      .then(setUsuarios)
      .catch((e) => setErro((e as Error).message))
      .finally(() => setCarregando(false));
  }, [slug]);

  async function alternarAtivo(usuario: UsuarioDoMunicipio) {
    setErro(null);
    try {
      await chamarSuperadmin(`/clientes/${slug}/usuarios/${usuario.id}/ativo`, {
        method: 'PATCH',
        body: JSON.stringify({ ativo: !usuario.ativo }),
      });
      setUsuarios((lista) => lista.map((u) => (u.id === usuario.id ? { ...u, ativo: !u.ativo } : u)));
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Usuários por município</h1>
        <select
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          {clientes.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.nomeMunicipio}/{c.uf}
            </option>
          ))}
        </select>
      </div>

      {erro && <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">E-mail</th>
                <th className="px-4 py-2 font-medium text-right">Módulos liberados</th>
                <th className="px-4 py-2 font-medium">Situação</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="px-4 py-2">{usuario.nome}</td>
                  <td className="px-4 py-2 text-neutral-500">{usuario.email}</td>
                  <td className="px-4 py-2 text-right">{usuario.modulos}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        usuario.ativo
                          ? 'rounded bg-green-100 px-2 py-0.5 text-xs text-green-800'
                          : 'rounded bg-neutral-200 px-2 py-0.5 text-xs text-neutral-700'
                      }
                    >
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button type="button" onClick={() => alternarAtivo(usuario)} className="text-blue-600 hover:underline">
                      {usuario.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                    Nenhum usuário neste município.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-neutral-500">
        Cadastro de novos usuários e ajuste de permissões continuam dentro de cada município, em
        Configurações › Usuários — quem administra a prefeitura é quem conhece os cargos.
      </p>
    </div>
  );
}
