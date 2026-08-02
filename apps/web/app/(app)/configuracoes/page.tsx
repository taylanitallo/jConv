'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ModuloSistema } from '@jconv/compartilhado';
import { usarPermissoes } from '../_componentes/contexto-permissoes';

const PRIMEIRA_ABA: { href: string; modulo: ModuloSistema }[] = [
  { href: '/configuracoes/gerais', modulo: 'ConfiguracoesGerais' },
  { href: '/configuracoes/municipio', modulo: 'ConfiguracoesMunicipio' },
  { href: '/configuracoes/secretarias', modulo: 'ConfiguracoesSecretarias' },
  { href: '/configuracoes/layout', modulo: 'ConfiguracoesLayout' },
  { href: '/configuracoes/usuarios', modulo: 'Usuarios' },
];

// /configuracoes sozinho nao tem conteudo: cai na primeira aba que o usuario enxerga - que nao
// e necessariamente Gerais, entao o destino depende das permissoes.
export default function PaginaConfiguracoes() {
  const roteador = useRouter();
  const { podeVer } = usarPermissoes();

  useEffect(() => {
    const destino = PRIMEIRA_ABA.find((aba) => podeVer(aba.modulo));
    roteador.replace(destino ? destino.href : '/');
  }, [roteador, podeVer]);

  return <p className="text-sm text-neutral-500">Carregando…</p>;
}
