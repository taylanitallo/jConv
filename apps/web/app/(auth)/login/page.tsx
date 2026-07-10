'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { esquemaLogin } from '@jconv/compartilhado';
import { chamarApi, ErroApi } from '../../../lib/api/cliente';

export default function PaginaLogin() {
  const roteador = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    const resultado = esquemaLogin.safeParse({ email, senha });
    if (!resultado.success) {
      setErro(resultado.error.issues[0]?.message ?? 'Dados inválidos');
      return;
    }

    setEnviando(true);
    try {
      await chamarApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify(resultado.data),
      });
      roteador.push('/');
      roteador.refresh();
    } catch (excecao) {
      setErro(excecao instanceof ErroApi ? excecao.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={aoEnviar}
        className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h1 className="text-xl font-semibold">jConv</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Entre com seu e-mail e senha cadastrados
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>

          {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </form>
    </main>
  );
}
