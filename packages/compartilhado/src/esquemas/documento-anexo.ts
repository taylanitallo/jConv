import { z } from 'zod';
import { TIPOS_DOCUMENTO_ANEXO } from '../enums/documento-anexo';

export const esquemaCriarDocumentoAnexo = z
  .object({
    convenioId: z.string().uuid().optional().nullable(),
    propostaId: z.string().uuid().optional().nullable(),
    cessaoTerrenoId: z.string().uuid().optional().nullable(),
    tipo: z.enum(TIPOS_DOCUMENTO_ANEXO),
    nomeArquivo: z.string().trim().min(1),
    arquivoCaminho: z.string().trim().min(1),
  })
  .refine(
    (dados) => [dados.convenioId, dados.propostaId, dados.cessaoTerrenoId].filter((v) => !!v).length === 1,
    { message: 'Informe exatamente um vínculo: Convênio, Proposta ou Cessão de Terreno' },
  );

export type CriarDocumentoAnexo = z.infer<typeof esquemaCriarDocumentoAnexo>;
