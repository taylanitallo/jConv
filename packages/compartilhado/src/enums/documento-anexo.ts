export const TIPOS_DOCUMENTO_ANEXO = [
  'Oficio',
  'PlanoDeTrabalho',
  'Termo',
  'Medicao',
  'NotaFiscal',
  'AIO',
  'Licitacao',
  'Outro',
] as const;
export type TipoDocumentoAnexo = (typeof TIPOS_DOCUMENTO_ANEXO)[number];

export const ROTULOS_TIPO_DOCUMENTO_ANEXO: Record<TipoDocumentoAnexo, string> = {
  Oficio: 'Ofício',
  PlanoDeTrabalho: 'Plano de Trabalho',
  Termo: 'Termo',
  Medicao: 'Medição',
  NotaFiscal: 'Nota Fiscal',
  AIO: 'AIO',
  Licitacao: 'Licitação',
  Outro: 'Outro',
};

export const ENTIDADES_DOCUMENTO_ANEXO = ['Convenio', 'Proposta', 'CessaoTerreno'] as const;
export type EntidadeDocumentoAnexo = (typeof ENTIDADES_DOCUMENTO_ANEXO)[number];
