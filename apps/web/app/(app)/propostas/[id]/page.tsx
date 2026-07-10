'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Proposta } from '@jconv/compartilhado';
import { propostasApi } from '../../../../lib/api/recursos';
import { FormularioProposta } from '../_componentes/formulario-proposta';
import { ModalPromoverProposta } from '../_componentes/modal-promover-proposta';

export default function PaginaEditarProposta() {
  const { id } = useParams<{ id: string }>();
  const [proposta, setProposta] = useState<Proposta | null>(null);
  const [promovendo, setPromovendo] = useState(false);

  useEffect(() => {
    propostasApi.obter(id).then(setProposta);
  }, [id]);

  if (!proposta) return <p className="text-sm text-neutral-500">Carregando…</p>;

  const podePromover = proposta.status === 'Aprovada' && !proposta.convenioGeradoId;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Editar proposta</h1>
        {podePromover && (
          <button
            type="button"
            onClick={() => setPromovendo(true)}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Promover a Convênio
          </button>
        )}
      </div>

      <FormularioProposta proposta={proposta} />

      {promovendo && <ModalPromoverProposta proposta={proposta} aoFechar={() => setPromovendo(false)} />}
    </div>
  );
}
