import { PapelUsuario } from '../enums/usuario';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface UsuarioOrgao {
  usuarioId: string;
  orgaoConcedenteId: string;
  criadoEm: string;
}
