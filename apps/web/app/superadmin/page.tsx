'use client';

import { FormEvent, useEffect, useState } from 'react';
import { chamarSuperadmin, type ClienteMunicipio } from '@/lib/api/superadmin';

export default function PaginaMunicipios() {
  const [clientes, setClientes] = useState<ClienteMunicipio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [formulario, setFormulario] = useState({ nomeMunicipio: '', slug: '', uf: '' });

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setClientes(await chamarSuperadmin<ClienteMunicipio[]>('/clientes'));
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  // O identificador vira parte da URL do cliente (/iraucuba) e o nome do schema, então é
  // sugerido a partir do nome sem acento nem espaço — mas continua editável.
  function sugerirSlug(nome: string) {
    return nome
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async function criar(evento: FormEvent) {
    evento.preventDefault();
    setCriando(true);
    setErro(null);
    setAviso(null);
    try {
      const r = await chamarSuperadmin<{ slug: string; migracoesAplicadas: number }>('/clientes', {
        method: 'POST',
        body: JSON.stringify(formulario),
      });
      setAviso(`Município "${r.slug}" criado — ${r.migracoesAplicadas} migration(s) aplicada(s) no schema novo.`);
      setFormulario({ nomeMunicipio: '', slug: '', uf: '' });
      await carregar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCriando(false);
    }
  }

  async function alternarAtivo(cliente: ClienteMunicipio) {
    setErro(null);
    try {
      await chamarSuperadmin(`/clientes/${cliente.slug}/ativo`, {
        method: 'PATCH',
        body: JSON.stringify({ ativo: !cliente.ativo }),
      });
      await carregar();
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function migrarTodos() {
    setErro(null);
    setAviso(null);
    try {
      const r = await chamarSuperadmin<{ slug: string; aplicadas: number }[]>('/clientes/migrar', { method: 'POST' });
      const total = r.reduce((soma, item) => soma + item.aplicadas, 0);
      setAviso(total ? `${total} migration(s) aplicada(s).` : 'Todos os municípios já estavam atualizados.');
      await carregar();
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Municípios</h1>
        <button
          type="button"
          onClick={migrarTodos}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Atualizar estrutura de todos
        </button>
      </div>

      {erro && <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{erro}</p>}
      {aviso && <p className="mb-4 rounded-md bg-green-50 px-4 py-2 text-sm text-green-700">{aviso}</p>}

      <form
        onSubmit={criar}
        className="mb-6 grid gap-3 rounded-lg border border-neutral-200 p-4 sm:grid-cols-[2fr,1.5fr,auto,auto] dark:border-neutral-800"
      >
        <label className="text-sm">
          <span className="mb-1 block font-medium">Município</span>
          <input
            required
            value={formulario.nomeMunicipio}
            onChange={(e) =>
              setFormulario((f) => ({
                ...f,
                nomeMunicipio: e.target.value,
                slug: f.slug || sugerirSlug(e.target.value),
              }))
            }
            className="w-full rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Identificador (URL)</span>
          <input
            required
            value={formulario.slug}
            onChange={(e) => setFormulario((f) => ({ ...f, slug: sugerirSlug(e.target.value) }))}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">UF</span>
          <input
            required
            maxLength={2}
            value={formulario.uf}
            onChange={(e) => setFormulario((f) => ({ ...f, uf: e.target.value.toUpperCase() }))}
            className="w-16 rounded-md border border-neutral-300 px-3 py-2 uppercase dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <button
          type="submit"
          disabled={criando}
          className="self-end rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {criando ? 'Criando…' : 'Criar município'}
        </button>
      </form>

      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 font-medium">Município</th>
                <th className="px-4 py-2 font-medium">URL</th>
                <th className="px-4 py-2 font-medium">Schema</th>
                <th className="px-4 py-2 font-medium text-right">Usuários</th>
                <th className="px-4 py-2 font-medium text-right">Convênios</th>
                <th className="px-4 py-2 font-medium">Situação</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="px-4 py-2">
                    {cliente.nomeMunicipio}/{cliente.uf}
                  </td>
                  <td className="px-4 py-2">
                    <a href={`/${cliente.slug}`} className="font-mono text-xs text-blue-600 hover:underline">
                      /{cliente.slug}
                    </a>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-neutral-500">{cliente.schemaNome}</td>
                  <td className="px-4 py-2 text-right">{cliente.usuarios}</td>
                  <td className="px-4 py-2 text-right">{cliente.convenios}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        cliente.ativo
                          ? 'rounded bg-green-100 px-2 py-0.5 text-xs text-green-800'
                          : 'rounded bg-neutral-200 px-2 py-0.5 text-xs text-neutral-700'
                      }
                    >
                      {cliente.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => alternarAtivo(cliente)}
                      className="text-blue-600 hover:underline"
                    >
                      {cliente.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-neutral-500">
                    Nenhum município cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-neutral-500">
        Desativar um município bloqueia o acesso imediatamente, sem apagar nada: os dados continuam
        no schema e voltam a aparecer ao reativar.
      </p>
    </div>
  );
}
