import { z } from 'zod';

export const esquemaLogin = z.object({
  email: z.string().trim().email('E-mail inválido'),
  senha: z.string().min(1, 'Informe a senha'),
});

export type Login = z.infer<typeof esquemaLogin>;
