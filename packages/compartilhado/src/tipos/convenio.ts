import { EsferaConvenio } from '../enums/esfera';
import { StatusGeralConvenio, TipoInstrumento } from '../enums/convenio';

export interface Convenio {
  id: string;
  numeroSequencial: number;

  orgaoConcedenteId: string;
  esfera: EsferaConvenio;

  tipoInstrumento: TipoInstrumento;
  objeto: string;

  valorConveniado: number | null;
  valorConcedido: number | null;
  valorContrapartida: number | null;
  valorLicitado: number | null;

  numeroConvenio: string | null;
  numeroMapp: string | null;
  numeroSic: string | null;
  numeroProposta: string | null;
  numeroProtocolo: string | null;
  numeroNup: string | null;
  numeroOperacaoCaixa: string | null;
  contaBancaria: string | null;

  dataAssinatura: string | null;
  dataInicioVigencia: string | null;
  dataFimVigencia: string | null;

  empresaContratadaId: string | null;
  vigenciaContratoEmpresa: string | null;

  saldoEmConta: number | null;
  saldoEmContaReferenciaEm: string | null;

  statusGeral: StatusGeralConvenio;
  percentualExecutadoFisico: number | null;
  percentualExecutadoFinanceiro: number | null;

  observacoes: string | null;

  criadoEm: string;
  atualizadoEm: string;
}
