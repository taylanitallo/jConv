import { z } from 'zod';
import { PAPEIS_USUARIO } from '../enums/usuario';

export const esquemaCriarUsuario = z.object({
  nome: z.string().trim().min(1, 'Informe o nome'),
  email: z.string().trim().email('E-mail inválido'),
  papel: z.enum(PAPEIS_USUARIO),
  orgaosConcedentesIds: z.array(z.string().uuid()).optional(),
});

export type CriarUsuario = z.infer<typeof esquemaCriarUsuario>;

export const esquemaAtualizarUsuario = z.object({
  nome: z.string().trim().min(1).optional(),
  papel: z.enum(PAPEIS_USUARIO).optional(),
  ativo: z.boolean().optional(),
  orgaosConcedentesIds: z.array(z.string().uuid()).optional(),
});

export type AtualizarUsuario = z.infer<typeof esquemaAtualizarUsuario>;
