import { TipoDocumentoAnexo } from '../enums/documento-anexo';

export interface DocumentoAnexo {
  id: string;
  convenioId: string | null;
  propostaId: string | null;
  cessaoTerrenoId: string | null;
  tipo: TipoDocumentoAnexo;
  nomeArquivo: string;
  arquivoCaminho: string;
  dataUpload: string;
  extraidoPorIa: boolean;
  criadoEm: string;
  atualizadoEm: string;
}
