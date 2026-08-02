import { z } from 'zod';
import { ORIENTACOES_PDF } from '../enums/configuracao';

const textoOpcional = z.string().trim().optional().nullable();

// Só existe "atualizar": a linha de configuração é criada pela migration 0024 e nunca é
// inserida nem excluída pela aplicação.
export const esquemaAtualizarConfiguracao = z.object({
  municipioNome: z.string().trim().min(1, 'Informe o nome do município').optional(),
  municipioUf: z.string().trim().length(2, 'UF deve ter 2 letras').optional(),
  municipioCnpj: textoOpcional,
  municipioEndereco: textoOpcional,
  municipioTelefone: textoOpcional,
  prefeitoNome: textoOpcional,
  brasaoUrl: textoOpcional,

  diasAlertaVigencia: z.number().int().min(1).max(365).optional(),
  diasAlertaContratoEmpresa: z.number().int().min(1).max(365).optional(),
  orgaoGestor: textoOpcional,
  emailContato: z.string().trim().email('E-mail inválido').optional().nullable().or(z.literal('')),

  orientacaoPadraoPdf: z.enum(ORIENTACOES_PDF).optional(),
  mostrarBrasaoRelatorio: z.boolean().optional(),
  rodapeRelatorio: textoOpcional,
});

export type AtualizarConfiguracao = z.infer<typeof esquemaAtualizarConfiguracao>;
