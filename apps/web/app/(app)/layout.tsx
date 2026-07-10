import { redirect } from 'next/navigation';
import { obterUsuarioAtual } from '../../lib/api/servidor';
import { BotaoSair } from './_componentes/botao-sair';

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuario = await obterUsuarioAtual();

  if (!usuario) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
        <span className="font-semibold">jConv</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{usuario.email}</span>
          <BotaoSair />
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
