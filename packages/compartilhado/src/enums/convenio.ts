export const TIPOS_INSTRUMENTO = [
  'Convenio',
  'TermoDeCompromisso',
  'EmendaParlamentar',
  'TransferenciaEspecial',
  'ContratoDeRepasse',
] as const;
export type TipoInstrumento = (typeof TIPOS_INSTRUMENTO)[number];

export const ROTULOS_TIPO_INSTRUMENTO: Record<TipoInstrumento, string> = {
  Convenio: 'Convênio',
  TermoDeCompromisso: 'Termo de Compromisso',
  EmendaParlamentar: 'Emenda Parlamentar',
  TransferenciaEspecial: 'Transferência Especial',
  ContratoDeRepasse: 'Contrato de Repasse',
};

export const STATUS_GERAL_CONVENIO = [
  'EmElaboracaoProjeto',
  'EmLicitacao',
  'ConvenioAssinado',
  'ObraEmExecucao',
  'ObraParada',
  'ObraConcluida',
  'EmPrestacaoContas',
  'PcEnviada',
  'PcAprovada',
  'AguardandoRepasse',
  'Suspensiva',
] as const;
export type StatusGeralConvenio = (typeof STATUS_GERAL_CONVENIO)[number];

export const ROTULOS_STATUS_GERAL_CONVENIO: Record<StatusGeralConvenio, string> = {
  EmElaboracaoProjeto: 'Em Elaboração de Projeto',
  EmLicitacao: 'Em Licitação',
  ConvenioAssinado: 'Convênio Assinado',
  ObraEmExecucao: 'Obra em Execução',
  ObraParada: 'Obra Parada',
  ObraConcluida: 'Obra Concluída',
  EmPrestacaoContas: 'Em Prestação de Contas',
  PcEnviada: 'PC Enviada',
  PcAprovada: 'PC Aprovada',
  AguardandoRepasse: 'Aguardando Repasse',
  Suspensiva: 'Suspensiva',
};

// Cor sugerida para o card/badge de status no Dashboard (verde=em dia, amarelo=atenção, vermelho=crítico)
export const COR_STATUS_GERAL_CONVENIO: Record<StatusGeralConvenio, 'verde' | 'amarelo' | 'vermelho' | 'neutro'> = {
  EmElaboracaoProjeto: 'neutro',
  EmLicitacao: 'neutro',
  ConvenioAssinado: 'verde',
  ObraEmExecucao: 'verde',
  ObraParada: 'vermelho',
  ObraConcluida: 'verde',
  EmPrestacaoContas: 'amarelo',
  PcEnviada: 'amarelo',
  PcAprovada: 'verde',
  AguardandoRepasse: 'amarelo',
  Suspensiva: 'vermelho',
};
