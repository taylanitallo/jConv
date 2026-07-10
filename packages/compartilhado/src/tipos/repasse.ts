import { TipoRepasse } from '../enums/repasse';

export interface Repasse {
  id: string;
  convenioId: string;
  tipo: TipoRepasse;
  data: string;
  valor: number;
  observacoes: string | null;
  criadoEm: string;
  atualizadoEm: string;
}
