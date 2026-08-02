import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { esquemaCriarDocumentoAnexo } from '@jconv/compartilhado';
import { DocumentosAnexosService } from './documentos-anexos.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PermissoesGuard } from '../../guardas/permissoes.guard';
import { Permissao } from '../../comum/decoradores/permissao.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { validarComEsquema } from '../../comum/validar';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('documentos-anexos')
@UseGuards(AutenticacaoGuard, PermissoesGuard)
@Permissao('Convenios', 'Parcial')
export class DocumentosAnexosController {
  constructor(private readonly service: DocumentosAnexosService) {}

  @Get()
  async listar(
    @ClienteSupabase() cliente: SupabaseClient,
    @Query('convenioId') convenioId?: string,
    @Query('propostaId') propostaId?: string,
    @Query('cessaoTerrenoId') cessaoTerrenoId?: string,
  ) {
    return paraCamelCase(await this.service.listar(cliente, { convenioId, propostaId, cessaoTerrenoId }));
  }

  @Post('upload-assinado')
  @Permissao('Convenios', 'Total')
  async criarUploadAssinado(@ClienteSupabase() cliente: SupabaseClient, @Body('nomeArquivo') nomeArquivo: unknown) {
    if (typeof nomeArquivo !== 'string' || !nomeArquivo.trim()) {
      throw new BadRequestException('Informe o nome do arquivo');
    }
    return this.service.criarUploadAssinado(cliente, nomeArquivo);
  }

  @Post()
  @Permissao('Convenios', 'Total')
  async registrar(@ClienteSupabase() cliente: SupabaseClient, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaCriarDocumentoAnexo, corpo);
    return paraCamelCase(await this.service.registrarDocumento(cliente, dados));
  }

  @Get(':id/download')
  async obterUrlDownload(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string) {
    return this.service.obterUrlDownload(cliente, id);
  }

  @Delete(':id')
  @Permissao('Convenios', 'Total')
  async excluir(@ClienteSupabase() cliente: SupabaseClient, @Param('id') id: string) {
    await this.service.excluir(cliente, id);
    return { sucesso: true };
  }
}
