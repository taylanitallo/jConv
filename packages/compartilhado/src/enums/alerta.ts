export const TIPOS_ALERTA = [
  'VigenciaProximaDoFim',
  'ContratoEmpresaVencendo',
  'SuspensivaComPrazo',
  'PcPendente',
  'ObraParadaSemAtualizacao',
] as const;
export type TipoAlerta = (typeof TIPOS_ALERTA)[number];

export const ROTULOS_TIPO_ALERTA: Record<TipoAlerta, string> = {
  VigenciaProximaDoFim: 'Vigência Próxima do Fim',
  ContratoEmpresaVencendo: 'Contrato de Empresa Vencendo',
  SuspensivaComPrazo: 'Suspensiva com Prazo',
  PcPendente: 'PC Pendente',
  ObraParadaSemAtualizacao: 'Obra Parada sem Atualização',
};

export const STATUS_ALERTA = ['Pendente', 'Lido', 'Resolvido'] as const;
export type StatusAlerta = (typeof STATUS_ALERTA)[number];

export const ROTULOS_STATUS_ALERTA: Record<StatusAlerta, string> = {
  Pendente: 'Pendente',
  Lido: 'Lido',
  Resolvido: 'Resolvido',
};
