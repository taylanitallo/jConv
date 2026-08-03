import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { NivelPermissao, ROTULOS_MODULO_SISTEMA, podeEditar, podeVer } from '@jconv/compartilhado';
import { CHAVE_PERMISSAO_EXIGIDA, PermissaoExigida } from '../comum/decoradores/permissao.decorator';

// Sempre usado depois do AutenticacaoGuard. Consulta o nível do usuário no módulo exigido pelo
// decorator @Permissao(...) e barra a requisição se for insuficiente.
//
// Esta guarda é conveniência de UX (erro 403 claro em vez de "0 registros"), não a barreira
// final: a RLS do banco aplica a mesma regra e é ela que protege quem chamar a API por fora.
@Injectable()
export class PermissoesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const exigida = this.reflector.getAllAndOverride<PermissaoExigida | undefined>(CHAVE_PERMISSAO_EXIGIDA, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (!exigida) {
      return true;
    }

    const requisicao = contexto.switchToHttp().getRequest<Request>();
    const cliente = requisicao.sessaoTenant?.cliente;
    const usuarioId = requisicao.usuarioAutenticado?.id;

    if (!cliente || !usuarioId) {
      throw new UnauthorizedException('Não autenticado');
    }

    const { data: usuario, error: erroUsuario } = await cliente
      .from('usuarios')
      .select('ativo')
      .eq('id', usuarioId)
      .single();

    if (erroUsuario || !usuario?.ativo) {
      throw new ForbiddenException('Usuário sem acesso ao sistema');
    }

    const { data, error } = await cliente
      .from('permissoes_usuario')
      .select('modulo, nivel')
      .eq('usuario_id', usuarioId)
      .in('modulo', exigida.modulos);

    // Consulta que falha não é "usuário sem permissão": tratar as duas coisas igual transforma
    // qualquer defeito na camada de dados num 403 convincente e muito difícil de rastrear.
    if (error) {
      throw new InternalServerErrorException(`Falha ao consultar permissões: ${error.message}`);
    }

    // Ausência de linha equivale a 'Nenhuma' (mesma regra da função no banco).
    const suficiente = (nivel: NivelPermissao) =>
      exigida.nivel === 'Total' ? podeEditar(nivel) : podeVer(nivel);
    const linhas = (data ?? []) as { modulo: string; nivel: string }[];
    const permitido = linhas.some((linha) => suficiente(linha.nivel as NivelPermissao));

    if (!permitido) {
      const rotulos = exigida.modulos.map((m) => ROTULOS_MODULO_SISTEMA[m]).join(' ou ');
      throw new ForbiddenException(
        exigida.nivel === 'Total'
          ? `Você não tem permissão para alterar ${rotulos}`
          : `Você não tem permissão para acessar ${rotulos}`,
      );
    }

    return true;
  }
}
