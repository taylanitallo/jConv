export interface Usuario {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  /** Secretaria do usuário. Quem tem secretaria só enxerga os órgãos dela; quem não tem, todos. */
  secretariaId: string | null;
  criadoEm: string;
  atualizadoEm: string;
}
