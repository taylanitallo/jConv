import { StatusMedicao } from '../enums/medicao';

export interface Medicao {
  id: string;
  convenioId: string;
  numeroMedicao: number;
  data: string;
  percentualAcumulado: number | null;
  valorPago: number | null;
  valorAPagar: number | null;
  status: StatusMedicao;
  observacoes: string | null;
  criadoEm: string;
  atualizadoEm: string;
}
