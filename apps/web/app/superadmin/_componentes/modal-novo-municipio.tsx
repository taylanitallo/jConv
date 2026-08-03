'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, RefreshCw, X } from 'lucide-react';
import { chamarSuperadmin } from '@/lib/api/superadmin';
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, ROTULO, UFS, gerarSlug } from './ui';

export function ModalNovoMunicipio({
  aoFechar,
  aoCriar,
}: {
  aoFechar: () => void;
  aoCriar: (mensagem: string) => void;
}) {
  const [form, setForm] = useState({ nomeMunicipio: '', slug: '', uf: 'CE' });
  const [slugManual, setSlugManual] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  // Trava a rolagem do que está atrás enquanto o modal existe — mesmo comportamento dos modais
  // do sistema do município.
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      const r = await chamarSuperadmin<{ slug: string; migracoesAplicadas: number }>('/clientes', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      aoCriar(`Município "${r.slug}" criado — ${r.migracoesAplicadas} migration(s) aplicada(s) no schema novo.`);
      aoFechar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-950">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div>
            <h2 className="font-semibold">Novo município</h2>
            <p className="mt-0.5 text-sm text-neutral-500">Cria um schema isolado no banco</p>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={enviar} className="space-y-5 p-6">
          {erro && (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {erro}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="col-span-2 block">
              <span className={ROTULO}>Nome do município</span>
              <input
                value={form.nomeMunicipio}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    nomeMunicipio: e.target.value,
                    slug: slugManual ? f.slug : gerarSlug(e.target.value),
                  }))
                }
                className={CAMPO}
                placeholder="Ex: Irauçuba"
                required
              />
            </label>
            <label className="block">
              <span className={ROTULO}>Identificador (URL)</span>
              <input
                value={form.slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
                }}
                className={`${CAMPO} font-mono`}
                placeholder="iraucuba"
                required
              />
              <p className="mt-1 text-xs text-neutral-500">Vira o endereço (/iraucuba) e o nome do schema</p>
            </label>
            <label className="block">
              <span className={ROTULO}>UF</span>
              <select
                value={form.uf}
                onChange={(e) => setForm((f) => ({ ...f, uf: e.target.value }))}
                className={CAMPO}
                required
              >
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            O schema nasce com a estrutura completa do sistema e vazio de dados. O primeiro administrador da
            prefeitura é cadastrado depois, na aba Usuários.
          </p>

          <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <button type="button" onClick={aoFechar} className={BOTAO_SECUNDARIO}>
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className={`${BOTAO_PRIMARIO} flex items-center gap-2`}>
              {salvando ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {salvando ? 'Criando…' : 'Criar município'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
