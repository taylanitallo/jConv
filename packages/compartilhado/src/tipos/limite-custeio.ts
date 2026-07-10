import { EsferaConvenio } from '../enums/esfera';
import { TipoLimiteCusteio } from '../enums/limite-custeio';

export interface LimiteCusteio {
  id: string;

  orgaoConcedenteId: string;
  esfera: EsferaConvenio;

  tipo: TipoLimiteCusteio;
  portariaReferencia: string | null;
  competenciaAno: number;

  valorTeto: number;
  valorUtilizado: number;
  saldo: number;

  observacoes: string | null;

  criadoEm: string;
  atualizadoEm: string;
}
