export const TIPOS_REPASSE = ['Parcela', 'Contrapartida'] as const;
export type TipoRepasse = (typeof TIPOS_REPASSE)[number];

export const ROTULOS_TIPO_REPASSE: Record<TipoRepasse, string> = {
  Parcela: 'Parcela',
  Contrapartida: 'Contrapartida',
};
