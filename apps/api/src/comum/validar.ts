import { BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

// Reaproveitado por todos os controllers: valida o corpo da requisição contra um esquema Zod
// de packages/compartilhado (o mesmo usado no formulário do frontend) e devolve 400 com o
// detalhamento dos campos inválidos em vez de deixar o erro do Zod estourar como 500.
export function validarComEsquema<T>(esquema: ZodSchema<T>, dados: unknown): T {
  const resultado = esquema.safeParse(dados);
  if (!resultado.success) {
    throw new BadRequestException(resultado.error.flatten());
  }
  return resultado.data;
}
