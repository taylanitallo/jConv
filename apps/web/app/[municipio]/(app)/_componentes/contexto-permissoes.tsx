'use client';

import { createContext, useContext } from 'react';
import {
  podeEditar as nivelEdita,
  podeVer as nivelVe,
  type MapaPermissoes,
  type ModuloSistema,
} from '@jconv/compartilhado';

interface ValorContexto {
  permissoes: MapaPermissoes;
  superadmin: boolean;
}

const ContextoPermissoes = createContext<ValorContexto>({ permissoes: {}, superadmin: false });

export function ProvedorPermissoes({
  permissoes,
  superadmin = false,
  children,
}: {
  permissoes: MapaPermissoes;
  superadmin?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ContextoPermissoes.Provider value={{ permissoes, superadmin }}>{children}</ContextoPermissoes.Provider>
  );
}

// Esconder um botão é conveniência, não segurança: a RLS aplica a mesma regra no banco. Se as
// duas discordarem, quem manda é o banco.
export function usarPermissoes() {
  const { permissoes, superadmin } = useContext(ContextoPermissoes);
  return {
    permissoes,
    superadmin,
    podeVer: (modulo: ModuloSistema) => nivelVe(permissoes[modulo]),
    podeEditar: (modulo: ModuloSistema) => nivelEdita(permissoes[modulo]),
  };
}
