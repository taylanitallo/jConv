'use client';

import { Building, Clock, Database, ExternalLink, Layers, Power, Users } from 'lucide-react';
import type { ClienteMunicipio } from '@/lib/api/superadmin';
import { BOTAO_PRIMARIO, Etiqueta, formatarDataCurta } from './ui';

/** Um município por cartão — a estrutura do painel do jProcesso, com as cores do jConv. */
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
      className={`flex flex-col gap-4 rounded-lg border p-5 transition-shadow hover:shadow-sm ${
        municipio.ativo
          ? 'border-neutral-200 dark:border-neutral-800'
          : 'border-neutral-200 opacity-60 dark:border-neutral-800'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800">
            <Building className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-medium leading-tight">{municipio.nomeMunicipio}</h3>
            <p className="truncate text-xs text-neutral-500">{municipio.uf}</p>
          </div>
        </div>
        <Etiqueta cor={municipio.ativo ? 'ativo' : 'neutra'}>{municipio.ativo ? 'Ativo' : 'Inativo'}</Etiqueta>
      </div>

      <div className="space-y-1.5 text-xs text-neutral-500">
        <div className="flex items-center gap-2">
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-900">/{municipio.slug}</code>
        </div>
        <div className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 shrink-0" />
          <span className="font-mono">{municipio.schemaNome}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>Criado em {formatarDataCurta(municipio.criadoEm)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span>
            {municipio.usuarios} usuário(s) · {municipio.convenios} convênio(s)
          </span>
        </div>
      </div>

      <a href={`/${municipio.slug}`} className={`${BOTAO_PRIMARIO} flex items-center justify-center gap-2`}>
        <ExternalLink className="h-4 w-4" /> Acessar sistema
      </a>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => aoGerenciar('info')}
          className="flex items-center justify-center gap-1.5 rounded-md border border-neutral-300 py-2 text-xs font-medium transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          <Layers className="h-3.5 w-3.5" /> Gerenciar
        </button>
        <button
          type="button"
          onClick={() => aoGerenciar('usuarios')}
          className="flex items-center justify-center gap-1.5 rounded-md border border-neutral-300 py-2 text-xs font-medium transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          <Users className="h-3.5 w-3.5" /> Usuários
        </button>
      </div>

      <button
        type="button"
        onClick={aoAlternarAtivo}
        className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors ${
          municipio.ativo
            ? 'text-neutral-500 hover:bg-neutral-50 hover:text-red-600 dark:hover:bg-neutral-900'
            : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900'
        }`}
      >
        <Power className="h-3.5 w-3.5" /> {municipio.ativo ? 'Desativar' : 'Reativar'}
      </button>
    </div>
  );
}
