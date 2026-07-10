'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { EmpresaContratada } from '@jconv/compartilhado';
import { empresasContratadasApi } from '../../../../lib/api/recursos';
import { FormularioEmpresaContratada } from '../_componentes/formulario-empresa-contratada';

export default function PaginaEditarEmpresaContratada() {
  const { id } = useParams<{ id: string }>();
  const [empresa, setEmpresa] = useState<EmpresaContratada | null>(null);

  useEffect(() => {
    empresasContratadasApi.obter(id).then(setEmpresa);
  }, [id]);

  if (!empresa) return <p className="text-sm text-neutral-500">Carregando…</p>;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Editar empresa contratada</h1>
      <FormularioEmpresaContratada empresa={empresa} />
    </div>
  );
}
