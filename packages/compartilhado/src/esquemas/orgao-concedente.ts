import { z } from 'zod';
import { ESFERAS_CONVENIO } from '../enums/esfera';

export const esquemaCriarOrgaoConcedente = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do órgão'),
  esfera: z.enum(ESFERAS_CONVENIO),
  parlamentarPadrinho: z.string().trim().optional().nullable(),
  contato: z.string().trim().optional().nullable(),
});

export type CriarOrgaoConcedente = z.infer<typeof esquemaCriarOrgaoConcedente>;

export const esquemaAtualizarOrgaoConcedente = esquemaCriarOrgaoConcedente.partial();
export type AtualizarOrgaoConcedente = z.infer<typeof esquemaAtualizarOrgaoConcedente>;
