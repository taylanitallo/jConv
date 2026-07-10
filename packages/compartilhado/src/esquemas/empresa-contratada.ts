import { z } from 'zod';

export const esquemaCriarEmpresaContratada = z.object({
  nome: z.string().trim().min(1, 'Informe o nome da empresa'),
  responsavelContato: z.string().trim().optional().nullable(),
  cnpj: z.string().trim().optional().nullable(),
});

export type CriarEmpresaContratada = z.infer<typeof esquemaCriarEmpresaContratada>;

export const esquemaAtualizarEmpresaContratada = esquemaCriarEmpresaContratada.partial();
export type AtualizarEmpresaContratada = z.infer<typeof esquemaAtualizarEmpresaContratada>;
