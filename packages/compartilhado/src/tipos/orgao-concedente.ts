import { EsferaConvenio } from '../enums/esfera';

export interface OrgaoConcedente {
  id: string;
  nome: string;
  esfera: EsferaConvenio;
  contato: string | null;
  criadoEm: string;
  atualizadoEm: string;
}
