import { SetMetadata } from '@nestjs/common';
import { PapelUsuario } from '@jconv/compartilhado';

export const CHAVE_PAPEIS_EXIGIDOS = 'papeisExigidos';

// Uso: @Papeis('Administrador', 'GestorConvenios') acima de um método de controller,
// combinado com @UseGuards(AutenticacaoGuard, PapeisGuard)
export const Papeis = (...papeis: PapelUsuario[]) => SetMetadata(CHAVE_PAPEIS_EXIGIDOS, papeis);
