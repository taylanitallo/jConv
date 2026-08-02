import { z } from 'zod';

export const esquemaCriarSecretaria = z.object({
  nome: z.string().trim().min(1, 'Informe o nome da secretaria'),
  sigla: z.string().trim().optional().nullable(),
  secretarioResponsavel: z.string().trim().optional().nullable(),
  contato: z.string().trim().optional().nullable(),
  ativo: z.boolean().optional(),
  /** Órgãos concedentes que esta secretaria enxerga (define o escopo do LeituraSecretario). */
  orgaosConcedentesIds: z.array(z.string().uuid()).optional(),
});

export type CriarSecretaria = z.infer<typeof esquemaCriarSecretaria>;

export const esquemaAtualizarSecretaria = esquemaCriarSecretaria.partial();
export type AtualizarSecretaria = z.infer<typeof esquemaAtualizarSecretaria>;
