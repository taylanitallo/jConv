import { z } from 'zod';

export const esquemaCriarUsuario = z.object({
  nome: z.string().trim().min(1, 'Informe o nome'),
  email: z.string().trim().email('E-mail inválido'),
  // O escopo do LeituraSecretario vem da Secretaria (migration 0024), não mais de uma lista
  // de órgãos por usuário.
  secretariaId: z.string().uuid().optional().nullable(),
});

export type CriarUsuario = z.infer<typeof esquemaCriarUsuario>;

export const esquemaAtualizarUsuario = z.object({
  nome: z.string().trim().min(1).optional(),
  ativo: z.boolean().optional(),
  secretariaId: z.string().uuid().optional().nullable(),
});

export type AtualizarUsuario = z.infer<typeof esquemaAtualizarUsuario>;
