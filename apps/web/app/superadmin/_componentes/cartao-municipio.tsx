'use client';

import { Building, Clock, Database, ExternalLink, Layers, Power, Users } from 'lucide-react';
import type { ClienteMunicipio } from '@/lib/api/superadmin';
import { Etiqueta, formatarDataCurta } from './ui';

/** Um município por cartão, no mesmo formato do painel do jProcesso. */
export function CartaoMunicipio({
  municipio,
  aoGerenciar,
  aoAlternarAtivo,
}: {
  municipio: ClienteMunicipio;
  aoGerenciar: (aba?: string) => void;
  aoAlternarAtivo: () => void;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border-2 bg-white p-5 shadow-sm transition-all hover:shadow-md ${
        municipio.ativo ? 'border-green-200' : 'border-gray-200 opacity-70'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm">
            <Building className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold leading-tight text-gray-900">{municipio.nomeMunicipio}</h3>
            <p className="truncate text-xs text-gray-500">
              {municipio.nomeMunicipio}/{municipio.uf}
            </p>
          </div>
        </div>
        <Etiqueta cor={municipio.ativo ? 'green' : 'gray'}>{municipio.ativo ? 'Ativo' : 'Inativo'}</Etiqueta>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2 text-gray-500">
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          <code className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-blue-700">/{municipio.slug}</code>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <Database className="h-3.5 w-3.5 shrink-0" />
          <span className="font-mono">{municipio.schemaNome}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>Criado: {formatarDataCurta(municipio.criadoEm)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span>
            {municipio.usuarios} usuário(s) · {municipio.convenios} convênio(s)
          </span>
        </div>
      </div>

      <a
        href={`/${municipio.slug}`}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        <ExternalLink className="h-4 w-4" /> Acessar Sistema
      </a>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => aoGerenciar('info')}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50"
        >
          <Layers className="h-3.5 w-3.5" /> Gerenciar
        </button>
        <button
          type="button"
          onClick={() => aoGerenciar('usuarios')}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Users className="h-3.5 w-3.5" /> Usuários
        </button>
      </div>

      <button
        type="button"
        onClick={aoAlternarAtivo}
        className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs transition-colors ${
          municipio.ativo
            ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
            : 'border-green-200 text-green-600 hover:bg-green-50'
        }`}
      >
        <Power className="h-3.5 w-3.5" /> {municipio.ativo ? 'Desativar' : 'Ativar'}
      </button>
    </div>
  );
}
