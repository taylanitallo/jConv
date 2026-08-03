'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { chamarSuperadmin } from '@/lib/api/superadmin';

// Entrada própria da administração: ela não pertence a município nenhum, então não passa pela
// tela de login de nenhuma prefeitura. O visual acompanha o do jProcesso — mesmo dono, mesma
// família de sistemas.
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="mb-1 text-2xl font-bold text-gray-900">Administrador Geral</h1>
            <p className="text-sm text-gray-500">Acesso ao painel de gerenciamento de municípios</p>
          </div>

          {erro && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <div className="mt-0.5 text-red-600">⚠️</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Erro de autenticação</p>
                <p className="mt-0.5 text-sm text-red-700">{erro}</p>
              </div>
            </div>
          )}

          <form onSubmit={entrar} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={entrando}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {entrando ? 'Autenticando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
