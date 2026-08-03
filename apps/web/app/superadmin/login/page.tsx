'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { chamarSuperadmin } from '@/lib/api/superadmin';
import { AVISO_ERRO, BOTAO_PRIMARIO, CAMPO, CARTAO, ROTULO } from '../_componentes/estilos';

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
        className={`${CARTAO} w-full max-w-sm`}
      >
        <div className="mb-6 flex items-baseline gap-2">
          <span className="text-lg font-semibold">jConv</span>
          <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-medium text-neutral-900">
            Administração do sistema
          </span>
        </div>

        {erro && <p className={AVISO_ERRO}>{erro}</p>}

        <label className="mb-4 block">
          <span className={ROTULO}>E-mail</span>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={CAMPO}
          />
        </label>

        <label className="mb-6 block">
          <span className={ROTULO}>Senha</span>
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={CAMPO}
          />
        </label>

        <button
          type="submit"
          disabled={entrando}
          className={`${BOTAO_PRIMARIO} w-full`}
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
