'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { chamarSuperadmin, type ClienteMunicipio } from '@/lib/api/superadmin';
import {
  AVISO_ERRO,
  AVISO_SUCESSO,
  BOTAO_PERIGO,
  BOTAO_PRIMARIO,
  BOTAO_SECUNDARIO,
  CAMPO,
  CARTAO,
} from '../_componentes/estilos';

export default function PaginaBackup() {
  const [clientes, setClientes] = useState<ClienteMunicipio[]>([]);
  const [slug, setSlug] = useState('');
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [arquivo, setArquivo] = useState<{ nome: string; conteudo: unknown; totais: Record<string, number> } | null>(
    null,
  );
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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Backup e restauração</h1>
        <select
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setArquivo(null);
            setConfirmando(false);
          }}
          className={`${CAMPO} w-auto`}
        >
          {clientes.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.nomeMunicipio}/{c.uf}
            </option>
          ))}
        </select>
      </div>

      {erro && <p className={AVISO_ERRO}>{erro}</p>}
      {aviso && <p className={AVISO_SUCESSO}>{aviso}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={CARTAO}>
          <h2 className="text-sm font-semibold">Gerar backup</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Baixa todos os dados de {municipio ? `${municipio.nomeMunicipio}/${municipio.uf}` : 'do município'} em um
            arquivo JSON. A estrutura das tabelas não vai junto — ela é reconstruída pelas migrations, então o arquivo
            continua válido mesmo depois de o sistema mudar.
          </p>
          <button type="button" onClick={baixar} disabled={!slug || ocupado !== null} className={`${BOTAO_PRIMARIO} mt-4`}>
            {ocupado === 'backup' ? 'Gerando…' : 'Baixar backup'}
          </button>
        </section>

        <section className={`${CARTAO} border-red-200 dark:border-red-900`}>
          <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">Restaurar backup</h2>
          <p className="mt-2 text-sm text-neutral-500">
            <strong>Substitui</strong> todos os dados do município pelos do arquivo. Roda em uma transação só: ou fica
            exatamente como no backup, ou nada muda.
          </p>

          <input
            type="file"
            accept="application/json"
            onChange={selecionarArquivo}
            className="mt-4 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-medium dark:file:bg-neutral-800 dark:file:text-neutral-200"
          />

          {arquivo && (
            <div className="mt-4 rounded-md bg-neutral-50 p-3 text-xs dark:bg-neutral-950">
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
            <button type="button" onClick={() => setConfirmando(true)} className={`${BOTAO_PERIGO} mt-4`}>
              Restaurar em /{slug}
            </button>
          )}

          {confirmando && (
            <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm dark:border-red-800 dark:bg-red-950">
              <p className="text-red-800 dark:text-red-300">
                Isto apaga os dados atuais de <strong>/{slug}</strong> e grava os do arquivo. Confirma?
              </p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={restaurar} disabled={ocupado !== null} className={BOTAO_PERIGO}>
                  {ocupado === 'restaurar' ? 'Restaurando…' : 'Sim, restaurar'}
                </button>
                <button type="button" onClick={() => setConfirmando(false)} className={BOTAO_SECUNDARIO}>
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
