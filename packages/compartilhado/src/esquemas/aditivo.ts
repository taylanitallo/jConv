import { z } from 'zod';
import { TIPOS_ADITIVO } from '../enums/aditivo';

export const esquemaCriarAditivo = z.object({
  convenioId: z.string().uuid(),
  tipo: z.enum(TIPOS_ADITIVO),
  data: z.string().date(),
  descricao: z.string().trim().min(1, 'Descreva o aditivo'),
});

export type CriarAditivo = z.infer<typeof esquemaCriarAditivo>;

export const esquemaAtualizarAditivo = esquemaCriarAditivo.partial().omit({ convenioId: true });
export type AtualizarAditivo = z.infer<typeof esquemaAtualizarAditivo>;
