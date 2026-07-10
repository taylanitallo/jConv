'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { CessaoTerreno } from '@jconv/compartilhado';
import { cessoesTerrenoApi } from '../../../../lib/api/recursos';
import { FormularioCessaoTerreno } from '../_componentes/formulario-cessao-terreno';

export default function PaginaEditarCessaoTerreno() {
  const { id } = useParams<{ id: string }>();
  const [cessao, setCessao] = useState<CessaoTerreno | null>(null);

  useEffect(() => {
    cessoesTerrenoApi.obter(id).then(setCessao);
  }, [id]);

  if (!cessao) return <p className="text-sm text-neutral-500">Carregando…</p>;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Editar cessão de terreno</h1>
      <FormularioCessaoTerreno cessao={cessao} />
    </div>
  );
}
