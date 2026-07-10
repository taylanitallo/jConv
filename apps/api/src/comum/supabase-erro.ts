import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PostgrestError } from '@supabase/supabase-js';

// Reaproveitado por todo service: transforma o {data, error} do supabase-js numa exceção
// NestJS com um corpo de erro decente, em vez de deixar o objeto de erro do PostgREST
// estourar cru como 500.
export function desembrulhar<T>(resultado: { data: T | null; error: PostgrestError | null }): T {
  if (resultado.error) {
    if (resultado.error.code === 'PGRST116') {
      throw new NotFoundException('Registro não encontrado');
    }
    throw new BadRequestException(resultado.error.message);
  }
  return resultado.data as T;
}
