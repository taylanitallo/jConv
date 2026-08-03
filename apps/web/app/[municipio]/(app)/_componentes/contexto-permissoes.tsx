'use client';

import { createContext, useContext } from 'react';
import {
  podeEditar as nivelEdita,
  podeVer as nivelVe,
  type MapaPermissoes,
  type ModuloSistema,
} from '@jconv/compartilhado';

const ContextoPermissoes = createContext<MapaPermissoes>({});

export function ProvedorPermissoes({
  permissoes,
  children,
}: {
  permissoes: MapaPermissoes;
  children: React.ReactNode;
}) {
  return <ContextoPermissoes.Provider value={permissoes}>{children}</ContextoPermissoes.Provider>;
}

// Esconder um botão é conveniência, não segurança: a RLS aplica a mesma regra no banco. Se as
// duas discordarem, quem manda é o banco.
export function usarPermissoes() {
  const permissoes = useContext(ContextoPermissoes);
  return {
    permissoes,
    podeVer: (modulo: ModuloSistema) => nivelVe(permissoes[modulo]),
    podeEditar: (modulo: ModuloSistema) => nivelEdita(permissoes[modulo]),
  };
}
