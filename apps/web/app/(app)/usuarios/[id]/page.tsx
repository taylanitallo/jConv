'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Usuario } from '@jconv/compartilhado';
import { usuariosApi } from '../../../../lib/api/recursos';
import { FormularioUsuario } from '../_componentes/formulario-usuario';

export default function PaginaEditarUsuario() {
  const { id } = useParams<{ id: string }>();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    usuariosApi.obter(id).then(setUsuario);
  }, [id]);

  if (!usuario) return <p className="text-sm text-neutral-500">Carregando…</p>;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Editar usuário</h1>
      <FormularioUsuario usuario={usuario} />
    </div>
  );
}
