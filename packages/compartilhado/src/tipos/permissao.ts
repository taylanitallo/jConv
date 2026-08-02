import { ModuloSistema, NivelPermissao } from '../enums/permissao';

export interface PermissaoUsuario {
  usuarioId: string;
  modulo: ModuloSistema;
  nivel: NivelPermissao;
}

/** Mapa módulo → nível, formato usado pelo frontend e por /auth/me. */
export type MapaPermissoes = Partial<Record<ModuloSistema, NivelPermissao>>;
