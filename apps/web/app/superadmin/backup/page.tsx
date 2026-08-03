'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { chamarSuperadmin, type ClienteMunicipio } from '@/lib/api/superadmin';

export default function PaginaBackup() {
  const [clientes, setClientes] = useState<ClienteMunicipio[]>([]);
  const [slug, setSlug] = useState('');
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [arquivo, setArquivo] = useState<{ nome: string; conteudo: unknown; totais: Record<string, number> } | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    chamarSuperadmin<ClienteMunicipio[]>('/clientes')
      .then((lista) => {
        setClientes(lista);
        if (lista.length) setSlug(lista[0].slug);
      })
      .catch((e) => setErro((e as Error).message));
  }, []);

  const municipio = clientes.find((c) => c.slug === slug);

  async function baixar() {
    setOcupado('backup');
    setErro(null);
    setAviso(null);
    try {
      const dados = await chamarSuperadmin<Record<string, unknown>>(`/clientes/${slug}/backup`);
      const url = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${slug}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setAviso('Backup gerado e baixado.');
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado(null);
    }
  }

  async function selecionarArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const selecionado = evento.target.files?.[0];
    setArquivo(null);
    setErro(null);
    setAviso(null);
    if (!selecionado) return;

    try {
      const conteudo = JSON.parse(await selecionado.text());
      if (conteudo?.versao !== 1 || !conteudo?.tabelas) {
        throw new Error('Arquivo não parece um backup do jConv.');
      }
      setArquivo({ nome: selecionado.name, conteudo, totais: conteudo.totais ?? {} });
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function restaurar() {
    if (!arquivo) return;
    setOcupado('restaurar');
    setErro(null);
    setAviso(null);
    try {
      const r = await chamarSuperadmin<{ restaurado: Record<string, number> }>(`/clientes/${slug}/restaurar`, {
        method: 'POST',
        body: JSON.stringify(arquivo.conteudo),
      });
      const total = Object.values(r.restaurado).reduce((s, n) => s + n, 0);
      setAviso(`Restauração concluída: ${total} registro(s) gravado(s) em /${slug}.`);
      setArquivo(null);
      setConfirmando(false);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Backup e restauração</h1>
        <select
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setArquivo(null);
            setConfirmando(false);
          }}
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
      {aviso && <p className="mb-4 rounded-md bg-green-50 px-4 py-2 text-sm text-green-700">{aviso}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="font-medium">Gerar backup</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Baixa todos os dados de {municipio ? `${municipio.nomeMunicipio}/${municipio.uf}` : 'do município'} em um
            arquivo JSON. A estrutura das tabelas não vai junto — ela é reconstruída pelas migrations, então o
            arquivo continua válido mesmo depois de o sistema mudar.
          </p>
          <button
            type="button"
            onClick={baixar}
            disabled={!slug || ocupado !== null}
            className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {ocupado === 'backup' ? 'Gerando…' : 'Baixar backup'}
          </button>
        </section>

        <section className="rounded-lg border border-red-200 p-4 dark:border-red-900">
          <h2 className="font-medium text-red-700 dark:text-red-400">Restaurar backup</h2>
          <p className="mt-1 text-sm text-neutral-500">
            <strong>Substitui</strong> todos os dados do município pelos do arquivo. Roda em uma transação só: ou
            fica exatamente como no backup, ou nada muda.
          </p>

          <input
            type="file"
            accept="application/json"
            onChange={selecionarArquivo}
            className="mt-3 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm dark:file:bg-neutral-800"
          />

          {arquivo && (
            <div className="mt-3 rounded-md bg-neutral-50 p-3 text-xs dark:bg-neutral-900">
              <p className="font-medium">{arquivo.nome}</p>
              <p className="mt-1 text-neutral-500">
                {Object.entries(arquivo.totais)
                  .filter(([, n]) => n > 0)
                  .map(([t, n]) => `${t}: ${n}`)
                  .join(' · ') || 'arquivo sem registros'}
              </p>
            </div>
          )}

          {arquivo && !confirmando && (
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Restaurar em /{slug}
            </button>
          )}

          {confirmando && (
            <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm dark:border-red-800 dark:bg-red-950">
              <p className="text-red-800 dark:text-red-300">
                Isto apaga os dados atuais de <strong>/{slug}</strong> e grava os do arquivo. Confirma?
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={restaurar}
                  disabled={ocupado !== null}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {ocupado === 'restaurar' ? 'Restaurando…' : 'Sim, restaurar'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmando(false)}
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
