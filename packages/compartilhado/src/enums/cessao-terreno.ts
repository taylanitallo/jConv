export const STATUS_CESSAO_TERRENO = ['DocumentacaoEmAnalise', 'AguardandoTermo', 'Concluida'] as const;
export type StatusCessaoTerreno = (typeof STATUS_CESSAO_TERRENO)[number];

export const ROTULOS_STATUS_CESSAO_TERRENO: Record<StatusCessaoTerreno, string> = {
  DocumentacaoEmAnalise: 'Documentação em Análise',
  AguardandoTermo: 'Aguardando Termo',
  Concluida: 'Concluída',
};
