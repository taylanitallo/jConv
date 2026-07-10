import { z } from 'zod';
import { TIPOS_REPASSE } from '../enums/repasse';

export const esquemaCriarRepasse = z.object({
  convenioId: z.string().uuid(),
  tipo: z.enum(TIPOS_REPASSE),
  data: z.string().date(),
  valor: z.number().positive(),
  observacoes: z.string().trim().optional().nullable(),
});

export type CriarRepasse = z.infer<typeof esquemaCriarRepasse>;

export const esquemaAtualizarRepasse = esquemaCriarRepasse.partial().omit({ convenioId: true });
export type AtualizarRepasse = z.infer<typeof esquemaAtualizarRepasse>;
