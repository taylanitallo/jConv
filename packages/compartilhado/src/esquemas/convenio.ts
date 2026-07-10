import { z } from 'zod';
import { STATUS_GERAL_CONVENIO, TIPOS_INSTRUMENTO } from '../enums/convenio';

export const esquemaCriarConvenio = z.object({
  orgaoConcedenteId: z.string().uuid('Selecione o órgão concedente'),
  tipoInstrumento: z.enum(TIPOS_INSTRUMENTO),
  objeto: z.string().trim().min(1, 'Descreva o objeto'),

  valorConveniado: z.number().nonnegative().optional().nullable(),
  valorConcedido: z.number().nonnegative().optional().nullable(),
  valorContrapartida: z.number().nonnegative().optional().nullable(),
  valorLicitado: z.number().nonnegative().optional().nullable(),

  numeroConvenio: z.string().trim().optional().nullable(),
  numeroMapp: z.string().trim().optional().nullable(),
  numeroSic: z.string().trim().optional().nullable(),
  numeroProposta: z.string().trim().optional().nullable(),
  numeroProtocolo: z.string().trim().optional().nullable(),
  numeroNup: z.string().trim().optional().nullable(),
  numeroOperacaoCaixa: z.string().trim().optional().nullable(),
  contaBancaria: z.string().trim().optional().nullable(),

  dataAssinatura: z.string().date().optional().nullable(),
  dataInicioVigencia: z.string().date().optional().nullable(),
  dataFimVigencia: z.string().date().optional().nullable(),

  empresaContratadaId: z.string().uuid().optional().nullable(),
  vigenciaContratoEmpresa: z.string().date().optional().nullable(),

  saldoEmConta: z.number().optional().nullable(),
  saldoEmContaReferenciaEm: z.string().date().optional().nullable(),

  statusGeral: z.enum(STATUS_GERAL_CONVENIO).default('EmElaboracaoProjeto'),
  percentualExecutadoFisico: z.number().min(0).max(100).optional().nullable(),
  percentualExecutadoFinanceiro: z.number().min(0).max(100).optional().nullable(),

  observacoes: z.string().trim().optional().nullable(),
});

export type CriarConvenio = z.infer<typeof esquemaCriarConvenio>;

export const esquemaAtualizarConvenio = esquemaCriarConvenio.partial();
export type AtualizarConvenio = z.infer<typeof esquemaAtualizarConvenio>;
