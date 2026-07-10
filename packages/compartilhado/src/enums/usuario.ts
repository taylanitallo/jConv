export const PAPEIS_USUARIO = ['Administrador', 'GestorConvenios', 'Financeiro', 'LeituraSecretario'] as const;
export type PapelUsuario = (typeof PAPEIS_USUARIO)[number];

export const ROTULOS_PAPEL_USUARIO: Record<PapelUsuario, string> = {
  Administrador: 'Administrador',
  GestorConvenios: 'Gestor de Convênios',
  Financeiro: 'Financeiro',
  LeituraSecretario: 'Leitura/Secretário',
};
