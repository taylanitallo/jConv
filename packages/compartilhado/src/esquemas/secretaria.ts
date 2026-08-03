import { z } from 'zod';

// A secretaria guarda só o que a identifica. Quem responde por ela é vínculo de usuário, e o
// alcance sobre convênios sai das permissões do usuário e do cadastro do convênio — não de uma
// lista de órgãos pendurada aqui.
export const esquemaCriarSecretaria = z.object({
  nome: z.string().trim().min(1, 'Informe o nome da secretaria'),
  sigla: z.string().trim().optional().nullable(),
  ativo: z.boolean().optional(),
});

export type CriarSecretaria = z.infer<typeof esquemaCriarSecretaria>;

export const esquemaAtualizarSecretaria = esquemaCriarSecretaria.partial();
export type AtualizarSecretaria = z.infer<typeof esquemaAtualizarSecretaria>;
