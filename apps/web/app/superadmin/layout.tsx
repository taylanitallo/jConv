'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ABAS = [
  { rotulo: 'Municípios', href: '/superadmin' },
  { rotulo: 'Usuários', href: '/superadmin/usuarios' },
  { rotulo: 'Acessos', href: '/superadmin/acessos' },
  { rotulo: 'Backup', href: '/superadmin/backup' },
];

// Área do dono do sistema, fora de qualquer município: não tem barra lateral de prefeitura nem
// contexto de permissões — quem entra aqui é validado pelo SuperadminGuard na API.
export default function LayoutSuperadmin({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-neutral-900 px-6 py-3 text-white dark:border-neutral-800">
        <div className="flex items-baseline gap-3">
          <span className="font-semibold">jConv</span>
          <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-medium text-neutral-900">
            Administração do sistema
          </span>
        </div>
        <Link href="/" className="text-sm text-neutral-300 hover:text-white">
          Sair da administração
        </Link>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <div className="mb-6 flex flex-wrap gap-1 border-b border-neutral-200 dark:border-neutral-800">
          {ABAS.map((aba) => {
            // "/superadmin" casaria com todas as abas se fosse por prefixo.
            const ativa = aba.href === '/superadmin' ? caminho === '/superadmin' : caminho?.startsWith(aba.href);
            return (
              <Link
                key={aba.href}
                href={aba.href}
                className={
                  ativa
                    ? 'border-b-2 border-amber-500 px-4 py-2 text-sm font-medium text-amber-600'
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
    </div>
  );
}
