export const ESFERAS_CONVENIO = ['Estadual', 'Federal', 'CaixaEconomica', 'Municipal'] as const;
export type EsferaConvenio = (typeof ESFERAS_CONVENIO)[number];

export const ROTULOS_ESFERA_CONVENIO: Record<EsferaConvenio, string> = {
  Estadual: 'Estadual',
  Federal: 'Federal',
  CaixaEconomica: 'Caixa Econômica',
  Municipal: 'Municipal',
};
