import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  ROTULOS_ESFERA_CONVENIO,
  ROTULOS_STATUS_GERAL_CONVENIO,
  type EsferaConvenio,
  type StatusGeralConvenio,
} from '@jconv/compartilhado';
import { ConfiguracaoService } from '../../configuracao/configuracao.service';
import { desembrulhar } from '../../comum/supabase-erro';
import { formatarData, formatarMoeda } from '../../comum/pdf-utilitarios';
import { DashboardService, FiltrosDashboard } from '../dashboard/dashboard.service';

const MODELO = 'claude-opus-4-8';

const SISTEMA_ASSISTENTE = `Você é o assistente de IA do jConv, sistema de gestão de convênios, propostas, \
emendas parlamentares, obras e prestações de contas da Prefeitura de Irauçuba/CE. Responda em \
português, de forma direta e precisa, baseando-se SOMENTE nos dados fornecidos no contexto. Se a \
pergunta não puder ser respondida com os dados disponíveis, diga isso claramente em vez de \
inventar informação. Valores monetários e datas devem ser citados exatamente como aparecem no \
contexto.`;

@Injectable()
export class IaService {
  constructor(
    private readonly configuracao: ConfiguracaoService,
    private readonly dashboardService: DashboardService,
  ) {}

  private obterCliente(): Anthropic {
    const chave = this.configuracao.anthropicApiKey;
    if (!chave) {
      throw new ServiceUnavailableException(
        'Camada de IA não configurada (ANTHROPIC_API_KEY ausente). Peça a um administrador para configurar a chave.',
      );
    }
    return new Anthropic({ apiKey: chave });
  }

  private async montarTabelaConvenios(cliente: SupabaseClient): Promise<string> {
    const convenios = desembrulhar<any[]>(
      await cliente
        .from('convenios')
        .select(
          'numero_sequencial, orgao_concedente_id, esfera, objeto, valor_conveniado, valor_concedido, status_geral, data_fim_vigencia',
        )
        .order('numero_sequencial'),
    );
    const orgaos = desembrulhar<{ id: string; nome: string }[]>(
      await cliente.from('orgaos_concedentes').select('id, nome'),
    );
    const nomeOrgao = new Map(orgaos.map((o) => [o.id, o.nome]));

    const linhas = convenios.map((c) =>
      [
        `nº${c.numero_sequencial}`,
        nomeOrgao.get(c.orgao_concedente_id) ?? '—',
        ROTULOS_ESFERA_CONVENIO[c.esfera as EsferaConvenio],
        c.objeto.length > 80 ? `${c.objeto.slice(0, 80)}…` : c.objeto,
        formatarMoeda(c.valor_conveniado),
        formatarMoeda(c.valor_concedido),
        ROTULOS_STATUS_GERAL_CONVENIO[c.status_geral as StatusGeralConvenio],
        formatarData(c.data_fim_vigencia),
      ].join(' | '),
    );

    return [
      'Nº | Órgão | Esfera | Objeto | Valor conveniado | Valor concedido | Status | Fim vigência',
      ...linhas,
    ].join('\n');
  }

  async perguntar(cliente: SupabaseClient, pergunta: string): Promise<string> {
    const anthropic = this.obterCliente();
    const tabela = await this.montarTabelaConvenios(cliente);

    const resposta = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 1500,
      thinking: { type: 'adaptive' },
      system: SISTEMA_ASSISTENTE,
      messages: [
        {
          role: 'user',
          content: `Dados atuais dos convênios (um por linha):\n\n${tabela}\n\nPergunta: ${pergunta}`,
        },
      ],
    });

    return resposta.content.find((b) => b.type === 'text')?.text ?? '';
  }

  async resumoConvenio(cliente: SupabaseClient, convenioId: string): Promise<string> {
    const anthropic = this.obterCliente();
    const convenio = desembrulhar(
      await cliente.from('convenios').select('*').eq('id', convenioId).single(),
    ) as Record<string, any>;

    const [orgao, medicoes, repasses, aditivos] = await Promise.all([
      cliente.from('orgaos_concedentes').select('nome').eq('id', convenio.orgao_concedente_id).single(),
      cliente.from('medicoes').select('*').eq('convenio_id', convenioId),
      cliente.from('repasses').select('*').eq('convenio_id', convenioId),
      cliente.from('aditivos').select('*').eq('convenio_id', convenioId),
    ]);

    const contexto = JSON.stringify(
      {
        convenio,
        orgao: orgao.data,
        medicoes: medicoes.data,
        repasses: repasses.data,
        aditivos: aditivos.data,
      },
      null,
      2,
    );

    const resposta = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 1000,
      thinking: { type: 'adaptive' },
      system: `${SISTEMA_ASSISTENTE} Gere um resumo executivo de 3 a 5 frases sobre o convênio a seguir, cobrindo objeto, situação atual, execução física/financeira e pontos de atenção (atrasos, pendências, vigência).`,
      messages: [{ role: 'user', content: contexto }],
    });

    return resposta.content.find((b) => b.type === 'text')?.text ?? '';
  }

  async resumoGeral(cliente: SupabaseClient, filtros: FiltrosDashboard): Promise<string> {
    const anthropic = this.obterCliente();
    const dados = await this.dashboardService.obterDados(cliente, filtros);

    const resposta = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 1200,
      thinking: { type: 'adaptive' },
      system: `${SISTEMA_ASSISTENTE} Gere um resumo executivo (1 parágrafo curto + até 5 bullets) sobre o panorama geral de convênios a seguir, destacando riscos (vencimentos próximos, obras paradas, PCs pendentes) e o total de recursos.`,
      messages: [{ role: 'user', content: JSON.stringify(dados, null, 2) }],
    });

    return resposta.content.find((b) => b.type === 'text')?.text ?? '';
  }

  async extrairDocumento(
    cliente: SupabaseClient,
    documentoId: string,
  ): Promise<Record<string, unknown>> {
    const anthropic = this.obterCliente();
    const documento = desembrulhar(
      await cliente.from('documentos_anexos').select('*').eq('id', documentoId).single(),
    ) as Record<string, any>;

    const { data: arquivo, error } = await cliente.storage
      .from('documentos-anexos')
      .download(documento.arquivo_caminho);
    if (error || !arquivo) {
      throw new ServiceUnavailableException('Não foi possível baixar o documento do Storage');
    }

    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const base64 = buffer.toString('base64');
    const tipoMidia = arquivo.type || 'application/pdf';
    const blocoConteudo =
      tipoMidia === 'application/pdf'
        ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 } }
        : {
            type: 'image' as const,
            source: { type: 'base64' as const, media_type: tipoMidia as 'image/png' | 'image/jpeg', data: base64 },
          };

    const resposta = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 1500,
      thinking: { type: 'adaptive' },
      system: `${SISTEMA_ASSISTENTE} Extraia do documento anexado os dados estruturados relevantes para um Repasse ou Medição de convênio (tipo, data, valor, número de parcela/medição, percentual). Responda APENAS com um JSON válido, sem texto antes ou depois, no formato: {"tipoSugerido": "Repasse"|"Medicao"|"Desconhecido", "data": "YYYY-MM-DD"|null, "valor": number|null, "numero": number|null, "percentual": number|null, "observacoes": string}.`,
      messages: [
        {
          role: 'user',
          content: [blocoConteudo, { type: 'text', text: 'Extraia os dados estruturados deste documento.' }],
        },
      ],
    });

    const texto = resposta.content.find((b) => b.type === 'text')?.text ?? '{}';
    try {
      return JSON.parse(texto);
    } catch {
      return { erro: 'Não foi possível interpretar a resposta da IA como JSON', bruto: texto };
    }
  }
}
