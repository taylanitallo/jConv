'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import {
  Activity,
  Building,
  Download,
  FileText,
  HardDrive,
  RefreshCw,
  RotateCcw,
  Users,
  XCircle,
} from 'lucide-react';
import {
  chamarSuperadmin,
  type Acesso,
  type ClienteMunicipio,
  type UsuarioDoMunicipio,
} from '@/lib/api/superadmin';
import { Etiqueta, formatarData } from './ui';

const ABAS = [
  { id: 'info', rotulo: 'Informações', Icone: Building },
  { id: 'usuarios', rotulo: 'Usuários', Icone: Users },
  { id: 'acessos', rotulo: 'Relatório', Icone: Activity },
  { id: 'backup', rotulo: 'Backup', Icone: HardDrive },
  { id: 'restore', rotulo: 'Restore', Icone: RotateCcw },
] as const;

type Aba = (typeof ABAS)[number]['id'];

export function ModalGerenciar({
  municipio,
  abaInicial = 'info',
  aoFechar,
  aoAtualizar,
}: {
  municipio: ClienteMunicipio;
  abaInicial?: string;
  aoFechar: () => void;
  aoAtualizar: () => void;
}) {
  const [aba, setAba] = useState<Aba>((abaInicial as Aba) ?? 'info');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700">
              <Building className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{municipio.nomeMunicipio}</h2>
              <p className="font-mono text-xs text-gray-500">
                /{municipio.slug} · {municipio.schemaNome}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Etiqueta cor={municipio.ativo ? 'green' : 'gray'}>{municipio.ativo ? 'Ativo' : 'Inativo'}</Etiqueta>
            <button
              type="button"
              onClick={aoFechar}
              className="rounded-xl p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex shrink-0 overflow-x-auto border-b border-gray-200 px-4">
          {ABAS.map(({ id, rotulo, Icone }) => (
            <button
              key={id}
              type="button"
              onClick={() => setAba(id)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                aba === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icone className="h-4 w-4" /> {rotulo}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {aba === 'info' && <AbaInformacoes municipio={municipio} />}
          {aba === 'usuarios' && <AbaUsuarios municipio={municipio} />}
          {aba === 'acessos' && <AbaAcessos municipio={municipio} />}
          {aba === 'backup' && <AbaBackup municipio={municipio} />}
          {aba === 'restore' && <AbaRestore municipio={municipio} aoRestaurar={aoAtualizar} />}
        </div>
      </div>
    </div>
  );
}

// ─── Informações ──────────────────────────────────────────────────────────────

function AbaInformacoes({ municipio }: { municipio: ClienteMunicipio }) {
  const campos: [string, string][] = [
    ['Município', municipio.nomeMunicipio],
    ['UF', municipio.uf],
    ['Identificador (URL)', `/${municipio.slug}`],
    ['Schema no banco', municipio.schemaNome],
    ['Criado em', formatarData(municipio.criadoEm)],
    ['Estrutura aplicada', `${municipio.migracoesAplicadas} migration(s)`],
    ['Usuários', String(municipio.usuarios)],
    ['Convênios', String(municipio.convenios)],
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {campos.map(([rotulo, valor]) => (
        <div key={rotulo} className="rounded-xl bg-gray-50 p-4">
          <p className="mb-1 text-xs text-gray-500">{rotulo}</p>
          <p className="break-all text-sm font-medium text-gray-900">{valor}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Usuários ─────────────────────────────────────────────────────────────────

function AbaUsuarios({ municipio }: { municipio: ClienteMunicipio }) {
  const [usuarios, setUsuarios] = useState<UsuarioDoMunicipio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      setUsuarios(await chamarSuperadmin<UsuarioDoMunicipio[]>(`/clientes/${municipio.slug}/usuarios`));
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [municipio.slug]);

  async function alternar(usuario: UsuarioDoMunicipio) {
    try {
      await chamarSuperadmin(`/clientes/${municipio.slug}/usuarios/${usuario.id}/ativo`, {
        method: 'PATCH',
        body: JSON.stringify({ ativo: !usuario.ativo }),
      });
      setUsuarios((lista) => lista.map((u) => (u.id === usuario.id ? { ...u, ativo: !u.ativo } : u)));
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  if (carregando) return <Carregando />;

  return (
    <div className="space-y-4">
      {erro && <Erro texto={erro} />}
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 text-right font-medium">Módulos</th>
              <th className="px-4 py-3 font-medium">Situação</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-gray-200">
                <td className="px-4 py-3 font-medium text-gray-900">{u.nome}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3 text-right tabular-nums">{u.modulos}</td>
                <td className="px-4 py-3">
                  <Etiqueta cor={u.ativo ? 'green' : 'gray'}>{u.ativo ? 'Ativo' : 'Inativo'}</Etiqueta>
                </td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => alternar(u)} className="text-xs font-medium text-blue-600 hover:underline">
                    {u.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Nenhum usuário neste município.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">
        Cadastro de novos usuários e ajuste de permissões ficam dentro do município, em Configurações ›
        Usuários — quem administra a prefeitura é quem conhece os cargos.
      </p>
    </div>
  );
}

// ─── Relatório de acesso ──────────────────────────────────────────────────────

function AbaAcessos({ municipio }: { municipio: ClienteMunicipio }) {
  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [dias, setDias] = useState(30);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    chamarSuperadmin<Acesso[]>(`/acessos?dias=${dias}&municipio=${municipio.slug}`)
      .then(setAcessos)
      .catch(() => undefined)
      .finally(() => setCarregando(false));
  }, [municipio.slug, dias]);

  function exportarCsv() {
    const linhas = [
      ['Data', 'E-mail', 'Resultado', 'Motivo', 'IP'],
      ...acessos.map((a) => [
        formatarData(a.criado_em),
        a.email,
        a.sucesso ? 'Entrou' : 'Falhou',
        a.motivo ?? '',
        a.ip ?? '',
      ]),
    ];
    // Ponto e vírgula e BOM: é o que o Excel em português abre sem pedir importação.
    const csv = '﻿' + linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `acessos-${municipio.slug}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <select
          value={dias}
          onChange={(e) => setDias(Number(e.target.value))}
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
        >
          <option value={7}>Últimos 7 dias</option>
          <option value={30}>Últimos 30 dias</option>
          <option value={90}>Últimos 90 dias</option>
          <option value={365}>Último ano</option>
        </select>
        <button
          type="button"
          onClick={exportarCsv}
          disabled={!acessos.length}
          className="flex items-center gap-1.5 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          <FileText className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      {carregando ? (
        <Carregando />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Resultado</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {acessos.map((a) => (
                <tr key={a.id} className="border-t border-gray-200">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatarData(a.criado_em)}</td>
                  <td className="px-4 py-3">{a.email}</td>
                  <td className="px-4 py-3">
                    <Etiqueta cor={a.sucesso ? 'green' : 'red'}>{a.sucesso ? 'Entrou' : a.motivo ?? 'Falhou'}</Etiqueta>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.ip ?? '—'}</td>
                </tr>
              ))}
              {acessos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    Nenhum acesso no período.
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

// ─── Backup ───────────────────────────────────────────────────────────────────

function AbaBackup({ municipio }: { municipio: ClienteMunicipio }) {
  const [gerando, setGerando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');

  async function baixar() {
    setGerando(true);
    setErro('');
    setAviso('');
    try {
      const dados = await chamarSuperadmin<{ totais: Record<string, number> }>(`/clientes/${municipio.slug}/backup`);
      const url = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${municipio.slug}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      const total = Object.values(dados.totais ?? {}).reduce((s, n) => s + n, 0);
      setAviso(`Backup gerado: ${total} registro(s).`);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="space-y-4">
      {erro && <Erro texto={erro} />}
      {aviso && <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{aviso}</p>}

      <div className="rounded-xl border border-gray-200 p-5">
        <h3 className="flex items-center gap-2 font-semibold text-gray-800">
          <HardDrive className="h-4 w-4" /> Gerar backup
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Baixa todos os dados de {municipio.nomeMunicipio}/{municipio.uf} em um arquivo JSON. A estrutura das tabelas
          não vai junto — ela é reconstruída pelas migrations, então o arquivo continua válido mesmo depois de o
          sistema mudar.
        </p>
        <button
          type="button"
          onClick={baixar}
          disabled={gerando}
          className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {gerando ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {gerando ? 'Gerando...' : 'Baixar backup'}
        </button>
      </div>
    </div>
  );
}

// ─── Restore ──────────────────────────────────────────────────────────────────

function AbaRestore({ municipio, aoRestaurar }: { municipio: ClienteMunicipio; aoRestaurar: () => void }) {
  const [arquivo, setArquivo] = useState<{ nome: string; conteudo: unknown; totais: Record<string, number> } | null>(
    null,
  );
  const [confirmacao, setConfirmacao] = useState('');
  const [restaurando, setRestaurando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  async function selecionar(evento: ChangeEvent<HTMLInputElement>) {
    const selecionado = evento.target.files?.[0];
    setArquivo(null);
    setErro('');
    setAviso('');
    setConfirmacao('');
    if (!selecionado) return;
    try {
      const conteudo = JSON.parse(await selecionado.text());
      if (conteudo?.versao !== 1 || !conteudo?.tabelas) throw new Error('Arquivo não é um backup do jConv.');
      setArquivo({ nome: selecionado.name, conteudo, totais: conteudo.totais ?? {} });
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function restaurar() {
    if (!arquivo) return;
    setRestaurando(true);
    setErro('');
    try {
      const r = await chamarSuperadmin<{ restaurado: Record<string, number> }>(
        `/clientes/${municipio.slug}/restaurar`,
        { method: 'POST', body: JSON.stringify(arquivo.conteudo) },
      );
      const total = Object.values(r.restaurado).reduce((s, n) => s + n, 0);
      setAviso(`Restauração concluída: ${total} registro(s) gravado(s).`);
      setArquivo(null);
      setConfirmacao('');
      aoRestaurar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setRestaurando(false);
    }
  }

  const totalArquivo = Object.values(arquivo?.totais ?? {}).reduce((s, n) => s + n, 0);

  return (
    <div className="space-y-4">
      {erro && <Erro texto={erro} />}
      {aviso && <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{aviso}</p>}

      <div className="rounded-xl border-2 border-red-200 p-5">
        <h3 className="flex items-center gap-2 font-semibold text-red-700">
          <RotateCcw className="h-4 w-4" /> Restaurar backup
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          <strong>Substitui</strong> todos os dados de {municipio.nomeMunicipio} pelos do arquivo. Roda em uma
          transação só: ou fica exatamente como no backup, ou nada muda.
        </p>

        <input
          type="file"
          accept="application/json"
          onChange={selecionar}
          className="mt-4 block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium"
        />

        {arquivo && (
          <>
            <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs">
              <p className="font-medium text-gray-900">{arquivo.nome}</p>
              <p className="mt-1 text-gray-500">{totalArquivo} registro(s) no arquivo</p>
            </div>

            <p className="mt-4 text-sm text-gray-700">
              Para confirmar, digite <strong className="font-mono">{municipio.slug}</strong>:
            </p>
            <input
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 font-mono text-sm"
              placeholder={municipio.slug}
            />

            <button
              type="button"
              onClick={restaurar}
              disabled={confirmacao !== municipio.slug || restaurando}
              className="mt-3 flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {restaurando ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              {restaurando ? 'Restaurando...' : 'Restaurar'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Auxiliares ───────────────────────────────────────────────────────────────

function Carregando() {
  return (
    <div className="py-12 text-center text-gray-400">
      <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin" />
      Carregando...
    </div>
  );
}

function Erro({ texto }: { texto: string }) {
  return <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{texto}</p>;
}
