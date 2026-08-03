'use client';

import type { LucideIcon } from 'lucide-react';

/** Peças visuais compartilhadas pelo painel, no mesmo padrão do jProcesso. */

const CORES_ETIQUETA = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
} as const;

export function Etiqueta({
  children,
  cor = 'gray',
}: {
  children: React.ReactNode;
  cor?: keyof typeof CORES_ETIQUETA;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CORES_ETIQUETA[cor]}`}>
      {children}
    </span>
  );
}

const CORES_INDICADOR = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
} as const;

export function Indicador({
  rotulo,
  valor,
  cor = 'blue',
  Icone,
}: {
  rotulo: string;
  valor: number | string;
  cor?: keyof typeof CORES_INDICADOR;
  Icone?: LucideIcon;
}) {
  return (
    <div className={`rounded-xl p-4 ${CORES_INDICADOR[cor]}`}>
      <div className="mb-1 flex items-center gap-2">
        {Icone && <Icone className="h-4 w-4 opacity-70" />}
        <p className="text-xs font-medium opacity-80">{rotulo}</p>
      </div>
      <p className="text-2xl font-bold">{valor}</p>
    </div>
  );
}

export function formatarData(valor?: string | null) {
  if (!valor) return '—';
  return new Date(valor).toLocaleString('pt-BR');
}

export function formatarDataCurta(valor?: string | null) {
  if (!valor) return '—';
  return new Date(valor).toLocaleDateString('pt-BR');
}

/** O identificador vira URL e nome de schema, então nasce sem acento, espaço ou maiúscula. */
export function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];
