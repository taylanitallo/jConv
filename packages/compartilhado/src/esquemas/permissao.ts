import { z } from 'zod';
import { MODULOS_SISTEMA, NIVEIS_PERMISSAO } from '../enums/permissao';

// Substitui o conjunto inteiro de permissões do usuário: a janela de Atribuições sempre envia
// todos os módulos, então não há estado parcial para reconciliar.
export const esquemaDefinirPermissoes = z.object({
  permissoes: z
    .array(
      z.object({
        modulo: z.enum(MODULOS_SISTEMA),
        nivel: z.enum(NIVEIS_PERMISSAO),
      }),
    )
    .max(MODULOS_SISTEMA.length),
});

export type DefinirPermissoes = z.infer<typeof esquemaDefinirPermissoes>;
