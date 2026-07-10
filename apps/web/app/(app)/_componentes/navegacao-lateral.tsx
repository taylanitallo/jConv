'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITENS_NAVEGACAO = [
  { rotulo: 'Dashboard', href: '/' },
  { rotulo: 'Convênios', href: '/convenios' },
  { rotulo: 'Propostas', href: '/propostas' },
  { rotulo: 'Cessões de Terreno', href: '/cessoes-terreno' },
  { rotulo: 'Limites de Custeio', href: '/limites-custeio' },
  { rotulo: 'Órgãos Concedentes', href: '/orgaos-concedentes' },
  { rotulo: 'Empresas Contratadas', href: '/empresas-contratadas' },
  { rotulo: 'Usuários', href: '/usuarios' },
];

export function NavegacaoLateral() {
  const caminhoAtual = usePathname();

  return (
    <nav className="w-56 shrink-0 border-r border-neutral-200 p-4 dark:border-neutral-800">
      <ul className="space-y-1">
        {ITENS_NAVEGACAO.map((item) => {
          const ativo = item.href === '/' ? caminhoAtual === '/' : caminhoAtual?.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
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
    </nav>
  );
}
