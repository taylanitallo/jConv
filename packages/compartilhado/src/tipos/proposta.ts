import { EsferaConvenio } from '../enums/esfera';
import { StatusProposta } from '../enums/proposta';

export interface Proposta {
  id: string;

  orgaoConcedenteId: string;
  esfera: EsferaConvenio;

  objeto: string;
  numeroProtocolo: string | null;
  numeroNup: string | null;

  status: StatusProposta;
  convenioGeradoId: string | null;

  observacoes: string | null;

  criadoEm: string;
  atualizadoEm: string;
}
