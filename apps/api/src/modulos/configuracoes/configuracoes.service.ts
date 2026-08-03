import { Injectable } from '@nestjs/common';
import { ClienteDados } from '../../banco/cliente-dados';
import { AtualizarConfiguracao } from '@jconv/compartilhado';
import { desembrulhar } from '../../comum/supabase-erro';

/** Id fixo da linha única de configuração (ver migration 0024). */
const ID_CONFIGURACAO = '00000000-0000-0000-0000-000000000001';

const MAPA_COLUNAS: Record<string, string> = {
  municipioNome: 'municipio_nome',
  municipioUf: 'municipio_uf',
  municipioCnpj: 'municipio_cnpj',
  municipioEndereco: 'municipio_endereco',
  municipioTelefone: 'municipio_telefone',
  prefeitoNome: 'prefeito_nome',
  brasaoUrl: 'brasao_url',
  diasAlertaVigencia: 'dias_alerta_vigencia',
  diasAlertaContratoEmpresa: 'dias_alerta_contrato_empresa',
  orgaoGestor: 'orgao_gestor',
  emailContato: 'email_contato',
  orientacaoPadraoPdf: 'orientacao_padrao_pdf',
  mostrarBrasaoRelatorio: 'mostrar_brasao_relatorio',
  rodapeRelatorio: 'rodape_relatorio',
};

/** Colunas de configuracoes em snake_case, como vêm do banco (antes do paraCamelCase). */
export interface LinhaConfiguracao {
  municipio_nome: string;
  municipio_uf: string;
  municipio_cnpj: string | null;
  municipio_endereco: string | null;
  municipio_telefone: string | null;
  prefeito_nome: string | null;
  brasao_url: string | null;
  dias_alerta_vigencia: number;
  dias_alerta_contrato_empresa: number;
  orgao_gestor: string | null;
  email_contato: string | null;
  orientacao_padrao_pdf: string;
  mostrar_brasao_relatorio: boolean;
  rodape_relatorio: string | null;
  atualizado_em: string;
}

// Linha única (ver migration 0024): não há criar nem excluir, só ler e atualizar.
@Injectable()
export class ConfiguracoesService {
  async obter(cliente: ClienteDados): Promise<LinhaConfiguracao> {
    return desembrulhar<LinhaConfiguracao>(await cliente.from('configuracoes').select('*').single());
  }

  async atualizar(cliente: ClienteDados, dados: AtualizarConfiguracao) {
    const payload: Record<string, unknown> = {};
    for (const [chaveCamel, chaveSnake] of Object.entries(MAPA_COLUNAS)) {
      const valor = (dados as Record<string, unknown>)[chaveCamel];
      if (valor !== undefined) payload[chaveSnake] = valor === '' ? null : valor;
    }

    if (Object.keys(payload).length === 0) return this.obter(cliente);

    return desembrulhar(
      await cliente.from('configuracoes').update(payload).eq('id', ID_CONFIGURACAO).select().single(),
    );
  }
}
