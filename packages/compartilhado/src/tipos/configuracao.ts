import { OrientacaoPdf } from '../enums/configuracao';

// Linha única de configuração do sistema (ver migration 0024). Alimenta as abas Gerais,
// Município e Layout do módulo de Configurações.
export interface ConfiguracaoSistema {
  municipioNome: string;
  municipioUf: string;
  municipioCnpj: string | null;
  municipioEndereco: string | null;
  municipioTelefone: string | null;
  prefeitoNome: string | null;
  brasaoUrl: string | null;

  diasAlertaVigencia: number;
  diasAlertaContratoEmpresa: number;
  orgaoGestor: string | null;
  emailContato: string | null;

  orientacaoPadraoPdf: OrientacaoPdf;
  mostrarBrasaoRelatorio: boolean;
  rodapeRelatorio: string | null;

  atualizadoEm: string;
}
