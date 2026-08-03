'use client';

import { FormEvent, useState } from 'react';
import { Building, Plus, RefreshCw, XCircle } from 'lucide-react';
import { chamarSuperadmin } from '@/lib/api/superadmin';
import { UFS, gerarSlug } from './ui';

const CAMPO =
  'w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500';
const ROTULO = 'mb-1 block text-xs font-medium text-gray-600';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Novo Município</h2>
            <p className="mt-0.5 text-sm text-gray-500">Cria um schema PostgreSQL isolado</p>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={enviar} className="space-y-5 p-6">
          {erro && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erro}</p>}

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Building className="h-4 w-4" /> Dados do Município
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={ROTULO}>Nome do Município *</label>
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
              </div>
              <div>
                <label className={ROTULO}>Identificador (URL) *</label>
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
                <p className="mt-1 text-xs text-gray-400">Vira o endereço (/iraucuba) e o nome do schema</p>
              </div>
              <div>
                <label className={ROTULO}>Estado (UF) *</label>
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
              </div>
            </div>
          </div>

          <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-800">
            O schema nasce com a estrutura completa do sistema e vazio de dados. O primeiro
            administrador da prefeitura é cadastrado depois, na aba Usuários.
          </p>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={aoFechar}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {salvando ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {salvando ? 'Criando...' : 'Criar Município'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
