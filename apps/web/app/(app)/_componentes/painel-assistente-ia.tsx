'use client';

import { FormEvent, useState } from 'react';
import { iaApi } from '../../../lib/api/recursos';
import { ErroApi } from '../../../lib/api/cliente';

export interface PainelAssistenteIaProps {
  /** Filtros atuais do Dashboard, repassados para o resumo executivo geral */
  filtros?: Record<string, string | undefined>;
}

export function PainelAssistenteIa({ filtros = {} }: PainelAssistenteIaProps) {
  const [pergunta, setPergunta] = useState('');
  const [resposta, setResposta] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [naoConfigurada, setNaoConfigurada] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function tratarErro(excecao: unknown) {
    if (excecao instanceof ErroApi && excecao.status === 503) {
      setNaoConfigurada(true);
      return;
    }
    setErro(excecao instanceof Error ? excecao.message : 'Erro ao consultar a IA');
  }

  async function aoPerguntar(evento: FormEvent) {
    evento.preventDefault();
    if (!pergunta.trim()) return;
    setErro(null);
    setCarregando(true);
    try {
      const { resposta: texto } = await iaApi.perguntar(pergunta);
      setResposta(texto);
    } catch (excecao) {
      tratarErro(excecao);
    } finally {
      setCarregando(false);
    }
  }

  async function aoGerarResumoGeral() {
    setErro(null);
    setCarregando(true);
    try {
      const { resumo } = await iaApi.resumoGeral(filtros);
      setResposta(resumo);
    } catch (excecao) {
      tratarErro(excecao);
    } finally {
      setCarregando(false);
    }
  }

  if (naoConfigurada) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
        Assistente de IA ainda não configurado neste ambiente (falta a chave da Anthropic). Peça a um
        administrador para configurá-la.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Assistente (IA)</h2>
        <button
          type="button"
          onClick={aoGerarResumoGeral}
          disabled={carregando}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          Gerar resumo executivo
        </button>
      </div>

      <form onSubmit={aoPerguntar} className="mb-3 flex gap-2">
        <input
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Ex.: quais convênios vencem em 2026?"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
        <button
          type="submit"
          disabled={carregando || !pergunta.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {carregando ? 'Consultando…' : 'Perguntar'}
        </button>
      </form>

      {erro && <p className="mb-2 text-sm text-red-600">{erro}</p>}

      {resposta && (
        <div className="whitespace-pre-wrap rounded-md bg-neutral-50 p-3 text-sm text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
          {resposta}
        </div>
      )}
    </div>
  );
}
