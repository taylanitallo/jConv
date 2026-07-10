import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';

export const UsuarioAtual = createParamDecorator((_dados: unknown, contexto: ExecutionContext) => {
  const requisicao = contexto.switchToHttp().getRequest<Request>();
  return requisicao.usuarioAutenticado;
});
