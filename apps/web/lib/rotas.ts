'use client';

import { useParams } from 'next/navigation';

/**
 * Devolve uma função que prefixa caminhos internos com o município da URL atual.
 *
 * Todo link do app precisa disso: `/convenios` sozinho não diz de qual prefeitura, e o
 * middleware mandaria para o município padrão — que seria o errado para todo mundo menos um.
 * Ler de useParams em vez de window.location mantém o comportamento correto na renderização do
 * servidor, onde window não existe.
 */
export function usarRota() {
  const parametros = useParams<{ municipio: string }>();
  const municipio = parametros?.municipio ?? '';
  return (caminho: string) => `/${municipio}${caminho === '/' ? '' : caminho}`;
}
