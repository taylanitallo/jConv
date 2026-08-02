import { PapelUsuario } from '../enums/usuario';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  ativo: boolean;
  /** Secretaria do usuário; define o escopo de órgãos do perfil LeituraSecretario. */
  secretariaId: string | null;
  criadoEm: string;
  atualizadoEm: string;
}
