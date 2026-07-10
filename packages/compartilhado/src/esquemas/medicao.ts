import { z } from 'zod';
import { STATUS_MEDICAO } from '../enums/medicao';

export const esquemaCriarMedicao = z.object({
  convenioId: z.string().uuid(),
  numeroMedicao: z.number().int().positive(),
  data: z.string().date(),
  percentualAcumulado: z.number().min(0).max(100).optional().nullable(),
  valorPago: z.number().nonnegative().optional().nullable(),
  valorAPagar: z.number().nonnegative().optional().nullable(),
  status: z.enum(STATUS_MEDICAO).default('Aguardando'),
  observacoes: z.string().trim().optional().nullable(),
});

export type CriarMedicao = z.infer<typeof esquemaCriarMedicao>;

export const esquemaAtualizarMedicao = esquemaCriarMedicao.partial().omit({ convenioId: true });
export type AtualizarMedicao = z.infer<typeof esquemaAtualizarMedicao>;
