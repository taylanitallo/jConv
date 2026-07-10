import { z } from 'zod';
import { STATUS_PROPOSTA } from '../enums/proposta';

export const esquemaCriarProposta = z.object({
  orgaoConcedenteId: z.string().uuid('Selecione o órgão concedente'),
  objeto: z.string().trim().min(1, 'Descreva o objeto'),
  numeroProtocolo: z.string().trim().optional().nullable(),
  numeroNup: z.string().trim().optional().nullable(),
  status: z.enum(STATUS_PROPOSTA).default('EmAnalise'),
  observacoes: z.string().trim().optional().nullable(),
});

export type CriarProposta = z.infer<typeof esquemaCriarProposta>;

export const esquemaAtualizarProposta = esquemaCriarProposta.partial();
export type AtualizarProposta = z.infer<typeof esquemaAtualizarProposta>;

// Payload da rotina de promoção (Proposta aprovada -> novo Convenio vinculado).
// Só os campos que NÃO existem em Proposta e não podem ser derivados automaticamente.
export const esquemaPromoverPropostaParaConvenio = z.object({
  tipoInstrumento: z.enum(['Convenio', 'TermoDeCompromisso', 'EmendaParlamentar', 'TransferenciaEspecial', 'ContratoDeRepasse']),
  valorConveniado: z.number().nonnegative().optional().nullable(),
  valorConcedido: z.number().nonnegative().optional().nullable(),
  valorContrapartida: z.number().nonnegative().optional().nullable(),
  numeroConvenio: z.string().trim().optional().nullable(),
  numeroMapp: z.string().trim().optional().nullable(),
  numeroSic: z.string().trim().optional().nullable(),
  dataAssinatura: z.string().date().optional().nullable(),
  dataInicioVigencia: z.string().date().optional().nullable(),
  dataFimVigencia: z.string().date().optional().nullable(),
});

export type PromoverPropostaParaConvenio = z.infer<typeof esquemaPromoverPropostaParaConvenio>;
