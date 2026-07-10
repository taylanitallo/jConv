export interface EmpresaContratada {
  id: string;
  nome: string;
  responsavelContato: string | null;
  cnpj: string | null;
  criadoEm: string;
  atualizadoEm: string;
}
