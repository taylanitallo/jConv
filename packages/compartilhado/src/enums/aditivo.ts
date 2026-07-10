export const TIPOS_ADITIVO = ['Prazo', 'Valor', 'Objeto'] as const;
export type TipoAditivo = (typeof TIPOS_ADITIVO)[number];

export const ROTULOS_TIPO_ADITIVO: Record<TipoAditivo, string> = {
  Prazo: 'Prazo',
  Valor: 'Valor',
  Objeto: 'Objeto',
};
