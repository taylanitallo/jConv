import { redirect } from 'next/navigation';
import { ErroApiIndisponivel, obterUsuarioAtual } from '../../lib/api/servidor';
import { AvisoApiIndisponivel } from './_componentes/aviso-api-indisponivel';
import { BotaoSair } from './_componentes/botao-sair';
import { NavegacaoLateral } from './_componentes/navegacao-lateral';

// Toda a área autenticada lê o cookie de sessão: nunca é pré-renderizada.
export const dynamic = 'force-dynamic';

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  let usuario;

  // Tratado aqui, e não por um error.tsx: um error boundary não captura o que é lançado pelo
  // layout do próprio segmento, e o da raiz também não pega este caso — verificado em produção,
  // onde a página caía no fallback interno do Next (<html id="__next_error__">).
  try {
    usuario = await obterUsuarioAtual();
  } catch (erro) {
    if (erro instanceof ErroApiIndisponivel) {
      return <AvisoApiIndisponivel detalhe={erro.message} />;
    }
    throw erro;
  }

  if (!usuario) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-3 print:hidden dark:border-neutral-800">
        <span className="font-semibold">jConv</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{usuario.email}</span>
          <BotaoSair />
        </div>
      </header>
      <div className="flex flex-1">
        <NavegacaoLateral />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
