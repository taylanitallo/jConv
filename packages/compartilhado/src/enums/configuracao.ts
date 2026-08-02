export const ORIENTACOES_PDF = ['retrato', 'paisagem'] as const;
export type OrientacaoPdf = (typeof ORIENTACOES_PDF)[number];

export const ROTULOS_ORIENTACAO_PDF: Record<OrientacaoPdf, string> = {
  retrato: 'Vertical',
  paisagem: 'Horizontal',
};
