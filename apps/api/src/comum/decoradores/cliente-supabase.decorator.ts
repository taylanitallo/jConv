import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';

// Injeta o cliente Supabase escopado ao usuário autenticado (ver AutenticacaoGuard) direto no
// parâmetro do método do controller, para ser repassado ao service — nunca usar o cliente
// admin (service role) para responder dados de negócio do usuário.
export const ClienteSupabase = createParamDecorator((_dados: unknown, contexto: ExecutionContext) => {
  const requisicao = contexto.switchToHttp().getRequest<Request>();
  return requisicao.supabaseClienteUsuario;
});
