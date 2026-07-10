export const STATUS_MEDICAO = ['Paga', 'EmAnalise', 'Aguardando'] as const;
export type StatusMedicao = (typeof STATUS_MEDICAO)[number];

export const ROTULOS_STATUS_MEDICAO: Record<StatusMedicao, string> = {
  Paga: 'Paga',
  EmAnalise: 'Em Análise',
  Aguardando: 'Aguardando',
};
