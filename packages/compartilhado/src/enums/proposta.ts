export const STATUS_PROPOSTA = ['EmAnalise', 'AguardandoAprovacao', 'Aprovada', 'Indeferida'] as const;
export type StatusProposta = (typeof STATUS_PROPOSTA)[number];

export const ROTULOS_STATUS_PROPOSTA: Record<StatusProposta, string> = {
  EmAnalise: 'Em Análise',
  AguardandoAprovacao: 'Aguardando Aprovação',
  Aprovada: 'Aprovada',
  Indeferida: 'Indeferida',
};
