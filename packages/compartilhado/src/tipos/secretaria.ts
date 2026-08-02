export interface Secretaria {
  id: string;
  nome: string;
  sigla: string | null;
  secretarioResponsavel: string | null;
  contato: string | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}
