import { z } from 'zod';

export const esquemaLogin = z.object({
  email: z.string().trim().email('E-mail inválido'),
  senha: z.string().min(1, 'Informe a senha'),
});

export type Login = z.infer<typeof esquemaLogin>;

export const esquemaDefinirSenha = z
  .object({
    senha: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres'),
    confirmarSenha: z.string().min(1, 'Confirme a senha'),
  })
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  });

export type DefinirSenha = z.infer<typeof esquemaDefinirSenha>;
