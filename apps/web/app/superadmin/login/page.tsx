'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { chamarSuperadmin } from '@/lib/api/superadmin';
import { BOTAO_PRIMARIO, CAMPO, ROTULO } from '../_componentes/ui';

// Entrada própria da administração: ela não pertence a município nenhum, então não passa pela
// tela de login de nenhuma prefeitura.
export default function PaginaLoginSuperadmin() {
  const roteador = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);

  async function entrar(evento: FormEvent) {
    evento.preventDefault();
    setErro('');
    setEntrando(true);
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
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="mb-1 text-xl font-semibold">Administrador Geral</h1>
            <p className="text-sm text-neutral-500">Acesso ao painel de gerenciamento de municípios</p>
          </div>

          {erro && (
            <div className="mb-4 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
              <div className="mt-0.5 text-red-600">⚠️</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">Erro de autenticação</p>
                <p className="mt-0.5 text-sm text-red-700 dark:text-red-400">{erro}</p>
              </div>
            </div>
          )}

          <form onSubmit={entrar} className="space-y-4">
            <label className="block">
              <span className={ROTULO}>E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                className={CAMPO}
                required
              />
            </label>

            <label className="block">
              <span className={ROTULO}>Senha</span>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className={CAMPO}
                required
              />
            </label>

            <button type="submit" disabled={entrando} className={`${BOTAO_PRIMARIO} w-full`}>
              {entrando ? 'Autenticando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
