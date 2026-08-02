import { SetMetadata } from '@nestjs/common';
import { ModuloSistema, NivelPermissao } from '@jconv/compartilhado';

export const CHAVE_PERMISSAO_EXIGIDA = 'permissaoExigida';

export interface PermissaoExigida {
  /** Basta ter o nível em UM dos módulos — usado onde uma rota serve mais de uma tela. */
  modulos: ModuloSistema[];
  /** 'Parcial' aceita Parcial ou Total; 'Total' exige Total. */
  nivel: NivelPermissao;
}

// Uso: @Permissao('Convenios', 'Total') acima de um método de controller, combinado com
// @UseGuards(AutenticacaoGuard, PermissoesGuard). Substitui o antigo @Papeis(...).
export const Permissao = (modulo: ModuloSistema | ModuloSistema[], nivel: NivelPermissao) =>
  SetMetadata(CHAVE_PERMISSAO_EXIGIDA, {
    modulos: Array.isArray(modulo) ? modulo : [modulo],
    nivel,
  } satisfies PermissaoExigida);
