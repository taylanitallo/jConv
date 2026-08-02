import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { RelatoriosService } from './relatorios.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PapeisGuard } from '../../guardas/papeis.guard';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { ORIENTACOES_PDF, type OrientacaoPdf } from '../../comum/pdf-utilitarios';
import { FiltrosDashboard } from '../dashboard/dashboard.service';

// Valor vindo da query string nunca é confiável: qualquer coisa fora da lista cai em 'retrato'
// (nenhum relatório deve falhar por causa de um parâmetro de layout mal escrito).
function orientacaoValida(valor?: string): OrientacaoPdf {
  return (ORIENTACOES_PDF as readonly string[]).includes(valor ?? '') ? (valor as OrientacaoPdf) : 'retrato';
}

function enviarPdf(resposta: Response, nomeArquivo: string, documento: PDFKit.PDFDocument) {
  resposta.setHeader('Content-Type', 'application/pdf');
  resposta.setHeader('Content-Disposition', `inline; filename="${nomeArquivo}"`);
  documento.pipe(resposta);
}

@Controller('relatorios')
@UseGuards(AutenticacaoGuard, PapeisGuard)
export class RelatoriosController {
  constructor(private readonly service: RelatoriosService) {}

  @Get('convenio/:id')
  async convenio(
    @ClienteSupabase() cliente: SupabaseClient,
    @Param('id') id: string,
    @Res() resposta: Response,
    @Query('orientacao') orientacao?: string,
  ) {
    const doc = await this.service.relatorioConvenio(cliente, id, orientacaoValida(orientacao));
    enviarPdf(resposta, `convenio-${id}.pdf`, doc);
  }

  @Get('convenio/:id/historico')
  async historicoConvenio(
    @ClienteSupabase() cliente: SupabaseClient,
    @Param('id') id: string,
    @Res() resposta: Response,
    @Query('orientacao') orientacao?: string,
  ) {
    const doc = await this.service.relatorioHistoricoConvenio(cliente, id, orientacaoValida(orientacao));
    enviarPdf(resposta, `historico-convenio-${id}.pdf`, doc);
  }

  @Get('consolidado')
  async consolidado(
    @ClienteSupabase() cliente: SupabaseClient,
    @Res() resposta: Response,
    @Query('esfera') esfera?: string,
    @Query('orgaoConcedenteId') orgaoConcedenteId?: string,
    @Query('statusGeral') statusGeral?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('orientacao') orientacao?: string,
  ) {
    const filtros: FiltrosDashboard = { esfera, orgaoConcedenteId, statusGeral, dataInicio, dataFim };
    const doc = await this.service.relatorioConvenios(
      cliente,
      filtros,
      'Relatório Consolidado de Convênios',
      orientacaoValida(orientacao),
    );
    enviarPdf(resposta, 'relatorio-consolidado.pdf', doc);
  }

  @Get('dashboard')
  async dashboard(
    @ClienteSupabase() cliente: SupabaseClient,
    @Res() resposta: Response,
    @Query('esfera') esfera?: string,
    @Query('orgaoConcedenteId') orgaoConcedenteId?: string,
    @Query('statusGeral') statusGeral?: string,
    @Query('orientacao') orientacao?: string,
  ) {
    const doc = await this.service.relatorioDashboard(
      cliente,
      { esfera, orgaoConcedenteId, statusGeral },
      orientacaoValida(orientacao),
    );
    enviarPdf(resposta, 'dashboard.pdf', doc);
  }
}
