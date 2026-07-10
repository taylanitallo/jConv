import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PapelUsuario } from '@jconv/compartilhado';
import { CHAVE_PAPEIS_EXIGIDOS } from '../comum/decoradores/papeis.decorator';

// Sempre usado depois do AutenticacaoGuard. Busca o papel/ativo do usuário direto pelo cliente
// Supabase escopado (respeitando a policy usuarios_select, que permite ler o próprio registro)
// e barra a requisição se o papel não estiver na lista exigida pelo decorator @Papeis(...).
@Injectable()
export class PapeisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const papeisExigidos = this.reflector.getAllAndOverride<PapelUsuario[] | undefined>(CHAVE_PAPEIS_EXIGIDOS, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (!papeisExigidos || papeisExigidos.length === 0) {
      return true;
    }

    const requisicao = contexto.switchToHttp().getRequest<Request>();
    const cliente = requisicao.supabaseClienteUsuario;
    const usuarioId = requisicao.usuarioAutenticado?.id;

    if (!cliente || !usuarioId) {
      throw new UnauthorizedException('Não autenticado');
    }

    const { data, error } = await cliente.from('usuarios').select('papel, ativo').eq('id', usuarioId).single();

    if (error || !data || !data.ativo) {
      throw new ForbiddenException('Usuário sem acesso ao sistema');
    }

    if (!papeisExigidos.includes(data.papel as PapelUsuario)) {
      throw new ForbiddenException('Seu papel não tem permissão para esta ação');
    }

    return true;
  }
}
