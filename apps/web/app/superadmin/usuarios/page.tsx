'use client';

import { useEffect, useState } from 'react';
import { chamarSuperadmin, type ClienteMunicipio, type UsuarioDoMunicipio } from '@/lib/api/superadmin';
import {
  ACAO_TABELA,
  AVISO_ERRO,
  CABECALHO_TABELA,
  CAMPO,
  CARTAO_LISTA,
  LINHA_TABELA,
  RODAPE_EXPLICATIVO,
  etiqueta,
} from '../_componentes/estilos';

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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Usuários por município</h1>
        <select value={slug} onChange={(e) => setSlug(e.target.value)} className={`${CAMPO} w-auto`}>
          {clientes.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.nomeMunicipio}/{c.uf}
            </option>
          ))}
        </select>
      </div>

      {erro && <p className={AVISO_ERRO}>{erro}</p>}

      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando…</p>
      ) : (
        <div className={CARTAO_LISTA}>
          <table className="w-full text-left text-sm">
            <thead className={CABECALHO_TABELA}>
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 text-right font-medium">Módulos liberados</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className={LINHA_TABELA}>
                  <td className="px-4 py-3 font-medium">{usuario.nome}</td>
                  <td className="px-4 py-3 text-neutral-500">{usuario.email}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{usuario.modulos}</td>
                  <td className="px-4 py-3">
                    <span className={etiqueta(usuario.ativo)}>{usuario.ativo ? 'Ativo' : 'Inativo'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => alternarAtivo(usuario)} className={ACAO_TABELA}>
                      {usuario.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr className={LINHA_TABELA}>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                    Nenhum usuário neste município.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className={RODAPE_EXPLICATIVO}>
        Cadastro de novos usuários e ajuste de permissões continuam dentro de cada município, em
        Configurações › Usuários — quem administra a prefeitura é quem conhece os cargos.
      </p>
    </div>
  );
}
