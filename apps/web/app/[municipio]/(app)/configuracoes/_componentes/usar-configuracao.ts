'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AtualizarConfiguracao, ConfiguracaoSistema } from '@jconv/compartilhado';
import { configuracoesApi } from '@/lib/api/recursos';

// Estado compartilhado pelas abas Gerais, Município e Layout: as três editam pedaços da mesma
// linha de configuração, então carregar/salvar fica num lugar só.
export function usarConfiguracao() {
  const [configuracao, setConfiguracao] = useState<ConfiguracaoSistema | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvoAgora, setSalvoAgora] = useState(false);

  useEffect(() => {
    configuracoesApi.obter().then(setConfiguracao).catch((e) => setErro(e.message));
  }, []);

  const salvar = useCallback(async (dados: AtualizarConfiguracao) => {
    setErro(null);
    setSalvando(true);
    setSalvoAgora(false);
    try {
      setConfiguracao(await configuracoesApi.atualizar(dados));
      setSalvoAgora(true);
    } catch (excecao) {
      setErro(excecao instanceof Error ? excecao.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }, []);

  return { configuracao, salvar, salvando, erro, salvoAgora };
}

export const CLASSE_CAMPO =
  'mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800';
export const CLASSE_ROTULO = 'block text-sm font-medium';
