'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { OrgaoConcedente } from '@jconv/compartilhado';
import { orgaosConcedentesApi } from '../../../../lib/api/recursos';
import { FormularioOrgaoConcedente } from '../_componentes/formulario-orgao-concedente';

export default function PaginaEditarOrgaoConcedente() {
  const { id } = useParams<{ id: string }>();
  const [orgao, setOrgao] = useState<OrgaoConcedente | null>(null);

  useEffect(() => {
    orgaosConcedentesApi.obter(id).then(setOrgao);
  }, [id]);

  if (!orgao) return <p className="text-sm text-neutral-500">Carregando…</p>;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Editar órgão concedente</h1>
      <FormularioOrgaoConcedente orgao={orgao} />
    </div>
  );
}
