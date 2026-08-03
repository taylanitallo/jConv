'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Globe, LogOut } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-2.5 shadow">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Painel do Administrador Geral</h1>
              <p className="text-xs text-gray-500">Gerenciamento de Municípios · jConv</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-gray-700 sm:block">Administrador Geral</span>
            <button
              type="button"
              onClick={sair}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">{children}</div>
    </div>
  );
}
