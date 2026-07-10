import { BadRequestException } from '@nestjs/common';
import { ZodType, ZodTypeDef } from 'zod';

// Reaproveitado por todos os controllers: valida o corpo da requisição contra um esquema Zod
// de packages/compartilhado (o mesmo usado no formulário do frontend) e devolve 400 com o
// detalhamento dos campos inválidos em vez de deixar o erro do Zod estourar como 500.
//
// Usa ZodType<T, ZodTypeDef, any> (não ZodSchema<T>, que fixa Input = Output) para o TS inferir
// T como o tipo de SAÍDA do schema mesmo em campos com .default(), onde a entrada é opcional
// mas a saída (após o parse) não é — senão o parâmetro T "vaza" como opcional pros services.
export function validarComEsquema<T>(esquema: ZodType<T, ZodTypeDef, any>, dados: unknown): T {
  const resultado = esquema.safeParse(dados);
  if (!resultado.success) {
    throw new BadRequestException(resultado.error.flatten());
  }
  return resultado.data;
}
