import { z } from 'zod';
import { STATUS_CESSAO_TERRENO } from '../enums/cessao-terreno';

export const esquemaCriarCessaoTerreno = z.object({
  orgaoConcedenteId: z.string().uuid('Selecione o órgão concedente'),
  objeto: z.string().trim().min(1, 'Descreva o objeto/finalidade'),
  numeroProtocolo: z.string().trim().optional().nullable(),
  numeroNup: z.string().trim().optional().nullable(),
  responsavelInterno: z.string().trim().optional().nullable(),
  status: z.enum(STATUS_CESSAO_TERRENO).default('DocumentacaoEmAnalise'),
  observacoes: z.string().trim().optional().nullable(),
});

export type CriarCessaoTerreno = z.infer<typeof esquemaCriarCessaoTerreno>;

export const esquemaAtualizarCessaoTerreno = esquemaCriarCessaoTerreno.partial();
export type AtualizarCessaoTerreno = z.infer<typeof esquemaAtualizarCessaoTerreno>;
