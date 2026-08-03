'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { chamarSuperadmin } from '@/lib/api/superadmin';

const ABAS = [
  { rotulo: 'Municípios', href: '/superadmin' },
  { rotulo: 'Usuários', href: '/superadmin/usuarios' },
  { rotulo: 'Acessos', href: '/superadmin/acessos' },
  { rotulo: 'Backup', href: '/superadmin/backup' },
];

// Área do dono do sistema, independente de qualquer município: tem login próprio, não tem barra
// lateral de prefeitura e não usa o contexto de permissões. Quem entra é validado pelo
// SuperadminGuard na API, a cada requisição.
export default function LayoutSuperadmin({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  const roteador = useRouter();

  // A tela de login é a única sem sessão — nela o cabeçalho e as abas não fazem sentido.
  if (caminho === '/superadmin/login') {
    return <>{children}</>;
  }

  async function sair() {
    await chamarSuperadmin('/logout', { method: 'POST' }).catch(() => undefined);
    roteador.replace('/superadmin/login');
    roteador.refresh();
  }

  return (
    // Mesmo fundo neutro da tela de login: o conteúdo vive em cartões brancos por cima dele.
    <div className="flex min-h-screen flex-col bg-neutral-100 dark:bg-neutral-950">
      <header className="flex items-center justify-between bg-neutral-900 px-6 py-3 text-white">
        <div className="flex items-baseline gap-3">
          <span className="font-semibold">jConv</span>
          <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-medium text-neutral-900">
            Administração do sistema
          </span>
        </div>
        <button type="button" onClick={sair} className="text-sm text-neutral-300 transition hover:text-white">
          Sair
        </button>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <nav className="mb-6 flex flex-wrap gap-1 border-b border-neutral-200 dark:border-neutral-800">
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
                    : 'border-b-2 border-transparent px-4 py-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-800 dark:hover:text-neutral-200'
                }
              >
                {aba.rotulo}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </div>
  );
}
