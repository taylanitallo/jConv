import { TipoAditivo } from '../enums/aditivo';

export interface Aditivo {
  id: string;
  convenioId: string;
  tipo: TipoAditivo;
  data: string;
  descricao: string;
  criadoEm: string;
  atualizadoEm: string;
}
