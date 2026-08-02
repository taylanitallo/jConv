import { z } from 'zod';

// Só existe "criar": o histórico não tem esquema de atualização nem de exclusão, de propósito.
export const esquemaCriarObservacaoConvenio = z.object({
  convenioId: z.string().uuid(),
  texto: z.string().trim().min(1, 'Escreva a observação'),
});

export type CriarObservacaoConvenio = z.infer<typeof esquemaCriarObservacaoConvenio>;
