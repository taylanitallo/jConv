'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Shield } from 'lucide-react';
import { chamarSuperadmin } from '@/lib/api/superadmin';

// Área do dono do sistema, independente de qualquer município: tem login próprio e não usa o
// contexto de permissões das prefeituras. Quem entra é validado pelo SuperadminGuard na API, a
// cada requisição — o que a tela mostra é conveniência, não barreira.
export default function LayoutSuperadmin({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  const roteador = useRouter();

  // A tela de login é a única sem sessão — nela o cabeçalho não faz sentido.
  if (caminho === '/superadmin/login') {
    return <>{children}</>;
  }

  async function sair() {
    await chamarSuperadmin('/logout', { method: 'POST' }).catch(() => undefined);
    roteador.replace('/superadmin/login');
    roteador.refresh();
  }

  return (
    <div className="min-h-screen">
      {/* Mesmo cabeçalho do sistema do município — o que muda é o crachá, que avisa onde se está. */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold">jConv</span>
            <span className="ml-2 rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              Administração do sistema
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-neutral-500 sm:block dark:text-neutral-400">Administrador Geral</span>
          <button
            type="button"
            onClick={sair}
            className="flex items-center gap-1.5 text-sm text-neutral-600 transition-colors hover:text-red-600 dark:text-neutral-300"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">{children}</div>
    </div>
  );
}
