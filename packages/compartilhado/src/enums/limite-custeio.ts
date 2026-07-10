export const TIPOS_LIMITE_CUSTEIO = ['PAP', 'MAC', 'Outro'] as const;
export type TipoLimiteCusteio = (typeof TIPOS_LIMITE_CUSTEIO)[number];

export const ROTULOS_TIPO_LIMITE_CUSTEIO: Record<TipoLimiteCusteio, string> = {
  PAP: 'PAP',
  MAC: 'MAC',
  Outro: 'Outro',
};
