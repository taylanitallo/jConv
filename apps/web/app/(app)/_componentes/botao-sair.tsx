'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { chamarApi } from '../../../lib/api/cliente';

export function BotaoSair() {
  const roteador = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function aoClicar() {
    setSaindo(true);
    try {
      await chamarApi('/auth/logout', { method: 'POST' });
    } finally {
      roteador.push('/login');
      roteador.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={saindo}
      className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      {saindo ? 'Saindo…' : 'Sair'}
    </button>
  );
}
