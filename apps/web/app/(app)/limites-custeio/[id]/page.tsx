'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { LimiteCusteio } from '@jconv/compartilhado';
import { limitesCusteioApi } from '../../../../lib/api/recursos';
import { FormularioLimiteCusteio } from '../_componentes/formulario-limite-custeio';

export default function PaginaEditarLimiteCusteio() {
  const { id } = useParams<{ id: string }>();
  const [limite, setLimite] = useState<LimiteCusteio | null>(null);

  useEffect(() => {
    limitesCusteioApi.obter(id).then(setLimite);
  }, [id]);

  if (!limite) return <p className="text-sm text-neutral-500">Carregando…</p>;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Editar limite de custeio</h1>
      <FormularioLimiteCusteio limite={limite} />
    </div>
  );
}
