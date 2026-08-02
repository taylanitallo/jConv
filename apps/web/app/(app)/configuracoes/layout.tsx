'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Abas como rotas de verdade (e não estado local): cada uma é linkável, sobrevive ao refresh e
// aparece no histórico do navegador.
const ABAS = [
  { rotulo: 'Gerais', href: '/configuracoes/gerais' },
  { rotulo: 'Município', href: '/configuracoes/municipio' },
  { rotulo: 'Secretarias', href: '/configuracoes/secretarias' },
  { rotulo: 'Layout', href: '/configuracoes/layout' },
  { rotulo: 'Usuários', href: '/configuracoes/usuarios' },
];

export default function LayoutConfiguracoes({ children }: { children: React.ReactNode }) {
  const caminhoAtual = usePathname();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Configurações</h1>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-neutral-200 print:hidden dark:border-neutral-800">
        {ABAS.map((aba) => {
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
