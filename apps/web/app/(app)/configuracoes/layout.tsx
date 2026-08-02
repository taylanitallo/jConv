'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ModuloSistema } from '@jconv/compartilhado';
import { usarPermissoes } from '../_componentes/contexto-permissoes';

// Abas como rotas de verdade (e não estado local): cada uma é linkável, sobrevive ao refresh e
// aparece no histórico do navegador.
const ABAS: { rotulo: string; href: string; modulo: ModuloSistema }[] = [
  { rotulo: 'Gerais', href: '/configuracoes/gerais', modulo: 'ConfiguracoesGerais' },
  { rotulo: 'Município', href: '/configuracoes/municipio', modulo: 'ConfiguracoesMunicipio' },
  { rotulo: 'Secretarias', href: '/configuracoes/secretarias', modulo: 'ConfiguracoesSecretarias' },
  { rotulo: 'Layout', href: '/configuracoes/layout', modulo: 'ConfiguracoesLayout' },
  { rotulo: 'Usuários', href: '/configuracoes/usuarios', modulo: 'Usuarios' },
];

export default function LayoutConfiguracoes({ children }: { children: React.ReactNode }) {
  const caminhoAtual = usePathname();
  const { podeVer } = usarPermissoes();
  const abasVisiveis = ABAS.filter((aba) => podeVer(aba.modulo));

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Configurações</h1>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-neutral-200 print:hidden dark:border-neutral-800">
        {abasVisiveis.map((aba) => {
          const ativa = caminhoAtual?.startsWith(aba.href);
          return (
            <Link
              key={aba.href}
              href={aba.href}
              className={
                ativa
                  ? 'border-b-2 border-blue-600 px-4 py-2 text-sm font-medium text-blue-600'
                  : 'px-4 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }
            >
              {aba.rotulo}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
