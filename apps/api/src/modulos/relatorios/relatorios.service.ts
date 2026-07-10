import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  ROTULOS_ESFERA_CONVENIO,
  ROTULOS_STATUS_GERAL_CONVENIO,
  ROTULOS_TIPO_INSTRUMENTO,
  ROTULOS_STATUS_MEDICAO,
  ROTULOS_TIPO_REPASSE,
  ROTULOS_TIPO_ADITIVO,
  type EsferaConvenio,
  type StatusGeralConvenio,
  type TipoInstrumento,
} from '@jconv/compartilhado';
import { desembrulhar } from '../../comum/supabase-erro';
import { criarDocumento, desenharTabela, formatarData, formatarMoeda, COR_PRIMARIA } from '../../comum/pdf-utilitarios';
import { DashboardService, FiltrosDashboard } from '../dashboard/dashboard.service';

@Injectable()
export class RelatoriosService {
  constructor(private readonly dashboardService: DashboardService) {}

  async relatorioConvenio(cliente: SupabaseClient, convenioId: string): Promise<PDFKit.PDFDocument> {
    const convenio = desembrulhar(await cliente.from('convenios').select('*').eq('id', convenioId).single()) as Record<
      string,
      any
    >;
    if (!convenio) throw new NotFoundException('Convênio não encontrado');

    const [orgao, empresa, medicoes, repasses, aditivos] = await Promise.all([
      cliente.from('orgaos_concedentes').select('nome').eq('id', convenio.orgao_concedente_id).single(),
      convenio.empresa_contratada_id
        ? cliente.from('empresas_contratadas').select('nome').eq('id', convenio.empresa_contratada_id).single()
        : Promise.resolve({ data: null }),
      cliente.from('medicoes').select('*').eq('convenio_id', convenioId).order('numero_medicao'),
      cliente.from('repasses').select('*').eq('convenio_id', convenioId).order('data'),
      cliente.from('aditivos').select('*').eq('convenio_id', convenioId).order('data'),
    ]);

    const doc = criarDocumento(
      `Convênio nº ${convenio.numero_sequencial}`,
      `${orgao.data?.nome ?? ''} — ${ROTULOS_ESFERA_CONVENIO[convenio.esfera as EsferaConvenio]}`,
    );

    doc.fontSize(11).text('Objeto', { underline: true });
    doc.fontSize(9).text(convenio.objeto);
    doc.moveDown(0.5);

    doc.fontSize(11).text('Dados gerais', { underline: true });
    doc.fontSize(9).text(`Tipo de instrumento: ${ROTULOS_TIPO_INSTRUMENTO[convenio.tipo_instrumento as TipoInstrumento]}`);
    doc.text(`Status: ${ROTULOS_STATUS_GERAL_CONVENIO[convenio.status_geral as StatusGeralConvenio]}`);
    doc.text(`Empresa contratada: ${empresa.data?.nome ?? '—'}`);
    doc.text(`Nº Convênio: ${convenio.numero_convenio ?? '—'}  |  MAPP: ${convenio.numero_mapp ?? '—'}  |  SIC: ${convenio.numero_sic ?? '—'}`);
    doc.text(`Protocolo: ${convenio.numero_protocolo ?? '—'}  |  NUP: ${convenio.numero_nup ?? '—'}`);
    doc.text(`Data de assinatura: ${formatarData(convenio.data_assinatura)}`);
    doc.text(`Vigência: ${formatarData(convenio.data_inicio_vigencia)} a ${formatarData(convenio.data_fim_vigencia)}`);
    doc.moveDown(0.5);

    doc.fontSize(11).text('Valores', { underline: true });
    doc.fontSize(9).text(`Conveniado: ${formatarMoeda(convenio.valor_conveniado)}`);
    doc.text(`Concedido: ${formatarMoeda(convenio.valor_concedido)}`);
    doc.text(`Contrapartida: ${formatarMoeda(convenio.valor_contrapartida)}`);
    doc.text(`Licitado: ${formatarMoeda(convenio.valor_licitado)}`);
    doc.text(`Saldo em conta: ${formatarMoeda(convenio.saldo_em_conta)}`);
    doc.text(
      `Execução: ${convenio.percentual_executado_fisico ?? '—'}% físico / ${convenio.percentual_executado_financeiro ?? '—'}% financeiro`,
    );
    doc.moveDown(1);

    if (medicoes.data?.length) {
      doc.fontSize(11).text('Medições', { underline: true });
      doc.moveDown(0.3);
      desenharTabela(
        doc,
        [
          { rotulo: 'Nº', largura: 40 },
          { rotulo: 'Data', largura: 70 },
          { rotulo: '% Acum.', largura: 60, alinhar: 'right' },
          { rotulo: 'Valor pago', largura: 90, alinhar: 'right' },
          { rotulo: 'Status', largura: 90 },
        ],
        medicoes.data.map((m: any) => [
          m.numero_medicao,
          formatarData(m.data),
          m.percentual_acumulado != null ? `${m.percentual_acumulado}%` : '—',
          formatarMoeda(m.valor_pago),
          ROTULOS_STATUS_MEDICAO[m.status as keyof typeof ROTULOS_STATUS_MEDICAO],
        ]),
      );
    }

    if (repasses.data?.length) {
      doc.fontSize(11).text('Repasses', { underline: true });
      doc.moveDown(0.3);
      desenharTabela(
        doc,
        [
          { rotulo: 'Tipo', largura: 100 },
          { rotulo: 'Data', largura: 90 },
          { rotulo: 'Valor', largura: 120, alinhar: 'right' },
        ],
        repasses.data.map((r: any) => [ROTULOS_TIPO_REPASSE[r.tipo as keyof typeof ROTULOS_TIPO_REPASSE], formatarData(r.data), formatarMoeda(r.valor)]),
      );
    }

    if (aditivos.data?.length) {
      doc.fontSize(11).text('Aditivos', { underline: true });
      doc.moveDown(0.3);
      desenharTabela(
        doc,
        [
          { rotulo: 'Tipo', largura: 80 },
          { rotulo: 'Data', largura: 80 },
          { rotulo: 'Descrição', largura: 260 },
        ],
        aditivos.data.map((a: any) => [ROTULOS_TIPO_ADITIVO[a.tipo as keyof typeof ROTULOS_TIPO_ADITIVO], formatarData(a.data), a.descricao]),
      );
    }

    if (convenio.observacoes) {
      doc.fontSize(11).text('Observações', { underline: true });
      doc.fontSize(8).text(convenio.observacoes);
    }

    doc.end();
    return doc;
  }

  async relatorioConvenios(cliente: SupabaseClient, filtros: FiltrosDashboard, titulo: string): Promise<PDFKit.PDFDocument> {
    let consulta = cliente
      .from('convenios')
      .select('numero_sequencial, orgao_concedente_id, esfera, objeto, valor_conveniado, valor_concedido, status_geral, data_assinatura')
      .order('numero_sequencial');

    if (filtros.esfera) consulta = consulta.eq('esfera', filtros.esfera);
    if (filtros.orgaoConcedenteId) consulta = consulta.eq('orgao_concedente_id', filtros.orgaoConcedenteId);
    if (filtros.statusGeral) consulta = consulta.eq('status_geral', filtros.statusGeral);
    if (filtros.dataInicio) consulta = consulta.gte('data_assinatura', filtros.dataInicio);
    if (filtros.dataFim) consulta = consulta.lte('data_assinatura', filtros.dataFim);

    const convenios = desembrulhar<any[]>(await consulta);
    const orgaos = desembrulhar<{ id: string; nome: string }[]>(
      await cliente.from('orgaos_concedentes').select('id, nome'),
    );
    const nomeOrgao = new Map(orgaos.map((o) => [o.id, o.nome]));

    const totalConveniado = convenios.reduce((acc, c) => acc + (c.valor_conveniado ?? 0), 0);
    const totalConcedido = convenios.reduce((acc, c) => acc + (c.valor_concedido ?? 0), 0);

    const doc = criarDocumento(titulo, `${convenios.length} convênio(s) encontrado(s)`);

    doc.fontSize(10).fillColor(COR_PRIMARIA).text(`Total conveniado: ${formatarMoeda(totalConveniado)}`);
    doc.fillColor('#000000').text(`Total concedido: ${formatarMoeda(totalConcedido)}`);
    doc.moveDown(0.8);

    desenharTabela(
      doc,
      [
        { rotulo: 'Nº', largura: 30 },
        { rotulo: 'Órgão', largura: 110 },
        { rotulo: 'Objeto', largura: 160 },
        { rotulo: 'Valor conveniado', largura: 90, alinhar: 'right' },
        { rotulo: 'Status', largura: 105 },
      ],
      convenios.map((c) => [
        c.numero_sequencial,
        nomeOrgao.get(c.orgao_concedente_id) ?? '—',
        c.objeto.length > 60 ? `${c.objeto.slice(0, 60)}…` : c.objeto,
        formatarMoeda(c.valor_conveniado),
        ROTULOS_STATUS_GERAL_CONVENIO[c.status_geral as StatusGeralConvenio],
      ]),
    );

    doc.end();
    return doc;
  }

  async relatorioDashboard(cliente: SupabaseClient, filtros: FiltrosDashboard): Promise<PDFKit.PDFDocument> {
    const dados = await this.dashboardService.obterDados(cliente, filtros);

    const doc = criarDocumento('Snapshot do Dashboard', 'Indicadores no estado atual dos filtros aplicados');

    const cartoes: [string, string][] = [
      ['Total conveniado', formatarMoeda(dados.indicadores.totalConveniado)],
      ['Total concedido', formatarMoeda(dados.indicadores.totalConcedido)],
      ['Total repassado', formatarMoeda(dados.indicadores.totalRepassado)],
      ['Total a receber', formatarMoeda(dados.indicadores.totalAReceber)],
      ['Convênios', String(dados.indicadores.quantidadeConvenios)],
      ['Vencendo em 30 dias', String(dados.indicadores.vencendo30Dias)],
      ['Vencendo em 60 dias', String(dados.indicadores.vencendo60Dias)],
      ['Vencendo em 90 dias', String(dados.indicadores.vencendo90Dias)],
      ['Obras paradas', String(dados.indicadores.obrasParadas)],
      ['PCs pendentes', String(dados.indicadores.pcsPendentes)],
    ];

    const larguraCartao = 170;
    const alturaCartao = 45;
    let x = doc.page.margins.left;
    let y = doc.y;
    cartoes.forEach(([rotulo, valor], indice) => {
      if (indice > 0 && indice % 3 === 0) {
        x = doc.page.margins.left;
        y += alturaCartao + 8;
      }
      doc.roundedRect(x, y, larguraCartao, alturaCartao, 4).stroke(COR_PRIMARIA);
      doc.fontSize(7.5).fillColor('#52514e').text(rotulo, x + 8, y + 6, { width: larguraCartao - 16 });
      doc.fontSize(13).fillColor('#000000').text(valor, x + 8, y + 20, { width: larguraCartao - 16 });
      x += larguraCartao + 10;
    });
    doc.y = y + alturaCartao + 20;
    doc.x = doc.page.margins.left;

    doc.fontSize(11).fillColor('#000000').text('Convênios por status', { underline: true });
    doc.moveDown(0.3);
    desenharTabela(
      doc,
      [
        { rotulo: 'Status', largura: 200 },
        { rotulo: 'Quantidade', largura: 100, alinhar: 'right' },
      ],
      dados.porStatus.map((s) => [ROTULOS_STATUS_GERAL_CONVENIO[s.chave as StatusGeralConvenio] ?? s.chave, s.quantidade]),
    );

    doc.fontSize(11).text('Ranking de órgãos por valor conveniado', { underline: true });
    doc.moveDown(0.3);
    desenharTabela(
      doc,
      [
        { rotulo: 'Órgão', largura: 220 },
        { rotulo: 'Valor conveniado', largura: 150, alinhar: 'right' },
      ],
      dados.rankingOrgaos.map((r) => [r.orgao, formatarMoeda(r.valor)]),
    );

    doc.end();
    return doc;
  }
}
