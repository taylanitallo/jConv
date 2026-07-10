import { z } from 'zod';
import { TIPOS_LIMITE_CUSTEIO } from '../enums/limite-custeio';

export const esquemaCriarLimiteCusteio = z.object({
  orgaoConcedenteId: z.string().uuid('Selecione o órgão concedente'),
  tipo: z.enum(TIPOS_LIMITE_CUSTEIO),
  portariaReferencia: z.string().trim().optional().nullable(),
  competenciaAno: z.number().int().min(2000).max(2100),
  valorTeto: z.number().nonnegative(),
  valorUtilizado: z.number().nonnegative().default(0),
  observacoes: z.string().trim().optional().nullable(),
});

export type CriarLimiteCusteio = z.infer<typeof esquemaCriarLimiteCusteio>;

export const esquemaAtualizarLimiteCusteio = esquemaCriarLimiteCusteio.partial();
export type AtualizarLimiteCusteio = z.infer<typeof esquemaAtualizarLimiteCusteio>;
