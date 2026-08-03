'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usarRota } from '@/lib/rotas';
import type { ModuloSistema } from '@jconv/compartilhado';
import { usarPermissoes } from './contexto-permissoes';

// Cada item exige ver pelo menos um módulo. Configurações é o guarda-chuva das cinco abas:
// aparece se o usuário enxergar qualquer uma delas.
const ITENS_NAVEGACAO: { rotulo: string; href: string; modulos: ModuloSistema[] }[] = [
  { rotulo: 'Dashboard', href: '/', modulos: ['Dashboard'] },
  { rotulo: 'Convênios', href: '/convenios', modulos: ['Convenios'] },
  { rotulo: 'Propostas', href: '/propostas', modulos: ['Propostas'] },
  { rotulo: 'Cessões de Terreno', href: '/cessoes-terreno', modulos: ['CessoesTerreno'] },
  { rotulo: 'Limites de Custeio', href: '/limites-custeio', modulos: ['LimitesCusteio'] },
  { rotulo: 'Órgãos Concedentes', href: '/orgaos-concedentes', modulos: ['OrgaosConcedentes'] },
  { rotulo: 'Empresas Contratadas', href: '/empresas-contratadas', modulos: ['EmpresasContratadas'] },
  {
    rotulo: 'Configurações',
    href: '/configuracoes',
    modulos: [
      'ConfiguracoesGerais',
      'ConfiguracoesMunicipio',
      'ConfiguracoesSecretarias',
      'ConfiguracoesLayout',
      'Usuarios',
    ],
  },
];

export function NavegacaoLateral() {
  const rota = usarRota();
  const caminhoAtual = usePathname();
  const { podeVer, superadmin } = usarPermissoes();
  const itensVisiveis = ITENS_NAVEGACAO.filter((item) => item.modulos.some(podeVer));

  return (
    <nav className="w-56 shrink-0 border-r border-neutral-200 p-4 print:hidden dark:border-neutral-800">
      <ul className="space-y-1">
        {itensVisiveis.map((item) => {
          const ativo = item.href === '/' ? caminhoAtual === '/' : caminhoAtual?.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={rota(item.href)}
                className={
                  ativo
                    ? 'block rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'block rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                }
              >
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Fora da lista e sem prefixo de município de propósito: a administração não pertence a
          nenhuma prefeitura. Aparece só para quem está em public.superadmins — e mesmo que
          alguém force a URL, o SuperadminGuard recusa na API. */}
      {superadmin && (
        <div className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Link
            href="/superadmin"
            className={
              caminhoAtual?.startsWith('/superadmin')
                ? 'block rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                : 'block rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
            }
          >
            Administração do sistema
          </Link>
        </div>
      )}
    </nav>
  );
}
