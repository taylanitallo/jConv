import { EsferaConvenio } from '../enums/esfera';
import { StatusCessaoTerreno } from '../enums/cessao-terreno';

export interface CessaoTerreno {
  id: string;

  orgaoConcedenteId: string;
  esfera: EsferaConvenio;

  objeto: string;
  numeroProtocolo: string | null;
  numeroNup: string | null;
  responsavelInterno: string | null;

  status: StatusCessaoTerreno;

  observacoes: string | null;

  criadoEm: string;
  atualizadoEm: string;
}
