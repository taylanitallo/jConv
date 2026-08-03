'use client';

import { FormEvent, useEffect, useState } from 'react';
import { chamarSuperadmin, type ClienteMunicipio } from '@/lib/api/superadmin';
import {
  ACAO_TABELA,
  AVISO_ERRO,
  AVISO_SUCESSO,
  BOTAO_PRIMARIO,
  BOTAO_SECUNDARIO,
  CABECALHO_TABELA,
  CAMPO,
  CARTAO,
  CARTAO_LISTA,
  LINHA_TABELA,
  RODAPE_EXPLICATIVO,
  ROTULO,
  etiqueta,
} from './_componentes/estilos';

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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Municípios</h1>
        <button type="button" onClick={migrarTodos} className={BOTAO_SECUNDARIO}>
          Atualizar estrutura de todos
        </button>
      </div>

      {erro && <p className={AVISO_ERRO}>{erro}</p>}
      {aviso && <p className={AVISO_SUCESSO}>{aviso}</p>}

      <form onSubmit={criar} className={`${CARTAO} mb-5`}>
        <h2 className="mb-4 text-sm font-semibold">Novo município</h2>
        <div className="grid gap-4 sm:grid-cols-[2fr,1.5fr,auto,auto]">
          <label>
            <span className={ROTULO}>Município</span>
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
              className={CAMPO}
            />
          </label>
          <label>
            <span className={ROTULO}>Identificador (URL)</span>
            <input
              required
              value={formulario.slug}
              onChange={(e) => setFormulario((f) => ({ ...f, slug: sugerirSlug(e.target.value) }))}
              className={`${CAMPO} font-mono text-xs`}
            />
          </label>
          <label>
            <span className={ROTULO}>UF</span>
            <input
              required
              maxLength={2}
              value={formulario.uf}
              onChange={(e) => setFormulario((f) => ({ ...f, uf: e.target.value.toUpperCase() }))}
              className={`${CAMPO} w-16 uppercase`}
            />
          </label>
          <button type="submit" disabled={criando} className={`${BOTAO_PRIMARIO} self-end`}>
            {criando ? 'Criando…' : 'Criar município'}
          </button>
        </div>
      </form>

      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando…</p>
      ) : (
        <div className={CARTAO_LISTA}>
          <table className="w-full text-left text-sm">
            <thead className={CABECALHO_TABELA}>
              <tr>
                <th className="px-4 py-3 font-medium">Município</th>
                <th className="px-4 py-3 font-medium">URL</th>
                <th className="px-4 py-3 font-medium">Schema</th>
                <th className="px-4 py-3 text-right font-medium">Usuários</th>
                <th className="px-4 py-3 text-right font-medium">Convênios</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id} className={LINHA_TABELA}>
                  <td className="px-4 py-3 font-medium">
                    {cliente.nomeMunicipio}/{cliente.uf}
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/${cliente.slug}`} className="font-mono text-xs text-neutral-600 hover:underline dark:text-neutral-300">
                      /{cliente.slug}
                    </a>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">{cliente.schemaNome}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{cliente.usuarios}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{cliente.convenios}</td>
                  <td className="px-4 py-3">
                    <span className={etiqueta(cliente.ativo)}>{cliente.ativo ? 'Ativo' : 'Inativo'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => alternarAtivo(cliente)} className={ACAO_TABELA}>
                      {cliente.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    Nenhum município cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className={RODAPE_EXPLICATIVO}>
        Desativar um município bloqueia o acesso imediatamente, sem apagar nada: os dados continuam
        no schema e voltam a aparecer ao reativar.
      </p>
    </div>
  );
}
