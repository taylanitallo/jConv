'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import {
  ROTULOS_ESFERA_CONVENIO,
  ROTULOS_STATUS_GERAL_CONVENIO,
  COR_STATUS_GERAL_CONVENIO,
  type EsferaConvenio,
  type StatusGeralConvenio,
} from '@jconv/compartilhado';
import { BotaoFecharJanela } from '@jconv/compartilhado/componentes';

export interface ConvenioDetalhado {
  id: string;
  numeroConvenio: string | null;
  objeto: string;
  orgao: string;
  esfera: EsferaConvenio;
  statusGeral: StatusGeralConvenio;
  valorConveniado: number;
  valorConcedido: number;
  valorRepassado: number;
  valorAReceber: number;
  dataFimVigencia: string | null;
  diasParaVencer: number | null;
}

/** Coluna extra da tabela, específica do indicador que foi clicado. */
export type ColunaDetalhe =
  | 'valorConveniado'
  | 'valorConcedido'
  | 'valorRepassado'
  | 'valorAReceber'
  | 'vigencia'
  | 'nenhuma';

export interface ModalDetalheIndicadorProps {
  titulo: string;
  descricao: string;
  coluna: ColunaDetalhe;
  itens: ConvenioDetalhado[];
  aoFechar: () => void;
}

const CORES_BADGE: Record<string, string> = {
  verde: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  amarelo: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  vermelho: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  neutro: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
};

const ROTULOS_COLUNA: Record<Exclude<ColunaDetalhe, 'nenhuma'>, string> = {
  valorConveniado: 'Valor conveniado',
  valorConcedido: 'Valor concedido',
  valorRepassado: 'Valor repassado',
  valorAReceber: 'Valor a receber',
  vigencia: 'Fim da vigência',
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function textoPrazo(dias: number | null) {
  if (dias == null) return '';
  if (dias === 0) return 'vence hoje';
  if (dias === 1) return 'em 1 dia';
  return `em ${dias} dias`;
}

export function ModalDetalheIndicador({
  titulo,
  descricao,
  coluna,
  itens,
  aoFechar,
}: ModalDetalheIndicadorProps) {
  // Janela apenas de leitura: Esc fecha sem risco de perder nada preenchido.
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') aoFechar();
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  // Trava a rolagem do dashboard atrás do modal. A largura da barra de rolagem que some vira
  // padding no body, senão a página inteira dá um salto lateral ao abrir e ao fechar.
  useEffect(() => {
    const { body } = document;
    const larguraBarra = window.innerWidth - document.documentElement.clientWidth;
    const overflowOriginal = body.style.overflow;
    const paddingOriginal = body.style.paddingRight;

    body.style.overflow = 'hidden';
    if (larguraBarra > 0) {
      const paddingAtual = Number.parseFloat(getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${paddingAtual + larguraBarra}px`;
    }

    return () => {
      body.style.overflow = overflowOriginal;
      body.style.paddingRight = paddingOriginal;
    };
  }, []);

  const ehMoeda = coluna !== 'vigencia' && coluna !== 'nenhuma';
  const total = ehMoeda ? itens.reduce((acc, item) => acc + item[coluna], 0) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-detalhe-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="flex max-h-[85vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl dark:bg-neutral-900">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 p-5 dark:border-neutral-800">
          <div>
            <h2 id="modal-detalhe-titulo" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {titulo}
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{descricao}</p>
          </div>
          <BotaoFecharJanela aoFechar={aoFechar} />
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-900">
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="px-4 py-2 font-medium">Objeto</th>
                <th className="px-4 py-2 font-medium">Órgão</th>
                <th className="px-4 py-2 font-medium">Esfera</th>
                <th className="px-4 py-2 font-medium">Status</th>
                {coluna !== 'nenhuma' && (
                  <th className="px-4 py-2 text-right font-medium">{ROTULOS_COLUNA[coluna]}</th>
                )}
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id} className="border-b border-neutral-100 dark:border-neutral-800/60">
                  <td className="max-w-md px-4 py-2">
                    {item.objeto}
                    {item.numeroConvenio && (
                      <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                        nº {item.numeroConvenio}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">{item.orgao}</td>
                  <td className="px-4 py-2">{ROTULOS_ESFERA_CONVENIO[item.esfera] ?? item.esfera}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
                        CORES_BADGE[COR_STATUS_GERAL_CONVENIO[item.statusGeral] ?? 'neutro']
                      }`}
                    >
                      {ROTULOS_STATUS_GERAL_CONVENIO[item.statusGeral] ?? item.statusGeral}
                    </span>
                  </td>
                  {coluna === 'vigencia' && (
                    <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">
                      {formatarData(item.dataFimVigencia)}
                      <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                        {textoPrazo(item.diasParaVencer)}
                      </span>
                    </td>
                  )}
                  {ehMoeda && (
                    <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">
                      {formatarMoeda(item[coluna])}
                    </td>
                  )}
                  <td className="px-4 py-2 text-right">
                    <Link href={`/convenios/${item.id}`} className="whitespace-nowrap text-blue-600 hover:underline">
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
              {itens.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    Nenhum convênio se enquadra neste indicador com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {itens.length} {itens.length === 1 ? 'convênio' : 'convênios'}
            {ehMoeda && (
              <>
                {' · total '}
                <span className="font-semibold tabular-nums">{formatarMoeda(total)}</span>
              </>
            )}
          </p>
          <div className="flex gap-3">
            <Link
              href="/convenios"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Ver todos os convênios
            </Link>
            <button
              type="button"
              onClick={aoFechar}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
