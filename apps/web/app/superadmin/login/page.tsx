'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { chamarSuperadmin } from '@/lib/api/superadmin';

// Entrada própria da administração: ela não pertence a município nenhum, então não passa pela
// tela de login de nenhuma prefeitura.
export default function PaginaLoginSuperadmin() {
  const roteador = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar(evento: FormEvent) {
    evento.preventDefault();
    setEntrando(true);
    setErro(null);
    try {
      await chamarSuperadmin('/login', { method: 'POST', body: JSON.stringify({ email, senha }) });
      roteador.replace('/superadmin');
      roteador.refresh();
    } catch (e) {
      setErro((e as Error).message);
      setEntrando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 dark:bg-neutral-950">
      <form
        onSubmit={entrar}
        className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="mb-6 flex items-baseline gap-2">
          <span className="text-lg font-semibold">jConv</span>
          <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-medium text-neutral-900">
            Administração do sistema
          </span>
        </div>

        {erro && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-medium">E-mail</span>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <label className="mb-5 block text-sm">
          <span className="mb-1 block font-medium">Senha</span>
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <button
          type="submit"
          disabled={entrando}
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          {entrando ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="mt-4 text-center text-xs text-neutral-500">
          Esta área gerencia todos os municípios. Para usar o sistema de uma prefeitura, acesse a
          URL dela.
        </p>
      </form>
    </div>
  );
}
