'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { esquemaDefinirSenha } from '@jconv/compartilhado';
import { criarClienteSupabaseNavegador } from '../../../lib/supabase/cliente-navegador';

// Destino do link de convite/recuperação de senha do Supabase Auth (chega como
// #access_token=...&refresh_token=...&type=invite na URL). Este cliente Supabase é usado só
// para esta troca pontual — o resto do app se autentica via cookie HTTP-only emitido pela API.
export default function PaginaDefinirSenha() {
  const roteador = useRouter();
  const [status, setStatus] = useState<'validando' | 'pronto' | 'invalido'>('validando');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');

    if (!accessToken || !refreshToken) {
      setStatus('invalido');
      return;
    }

    criarClienteSupabaseNavegador()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => setStatus(error ? 'invalido' : 'pronto'));
  }, []);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    const resultado = esquemaDefinirSenha.safeParse({ senha, confirmarSenha });
    if (!resultado.success) {
      setErro(resultado.error.issues[0]?.message ?? 'Dados inválidos');
      return;
    }

    setEnviando(true);
    const supabase = criarClienteSupabaseNavegador();
    const { error } = await supabase.auth.updateUser({ password: resultado.data.senha });
    await supabase.auth.signOut();
    setEnviando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    roteador.push('/login?senhaDefinida=1');
  }

  if (status === 'validando') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p className="text-sm text-neutral-500">Validando link…</p>
      </main>
    );
  }

  if (status === 'invalido') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h1 className="text-xl font-semibold">Link inválido ou expirado</h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Peça a um administrador para reenviar o convite ou o e-mail de redefinição de senha.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={aoEnviar}
        className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h1 className="text-xl font-semibold">Definir senha</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Escolha a senha que você vai usar para entrar no jConv.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="senha" className="block text-sm font-medium">
              Nova senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="new-password"
              required
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>

          <div>
            <label htmlFor="confirmarSenha" className="block text-sm font-medium">
              Confirmar senha
            </label>
            <input
              id="confirmarSenha"
              type="password"
              autoComplete="new-password"
              required
              value={confirmarSenha}
              onChange={(evento) => setConfirmarSenha(evento.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>

          {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {enviando ? 'Salvando…' : 'Definir senha e continuar'}
          </button>
        </div>
      </form>
    </main>
  );
}
