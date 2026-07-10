import { StatusAlerta, TipoAlerta } from '../enums/alerta';

export interface Alerta {
  id: string;
  convenioId: string;
  tipo: TipoAlerta;
  dataDisparo: string;
  status: StatusAlerta;
  descricao: string | null;
  criadoEm: string;
  atualizadoEm: string;
}
