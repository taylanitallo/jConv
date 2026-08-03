import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SuperadminGuard } from './superadmin.guard';
import { SuperadminService } from './superadmin.service';

// Fora do TenantMiddleware de propósito (ver AppModule): estas rotas trabalham no schema mestre
// e atravessam municípios, então não existe "o município da requisição" aqui.
@Controller('superadmin')
@UseGuards(SuperadminGuard)
export class SuperadminController {
  constructor(private readonly service: SuperadminService) {}

  @Get('clientes')
  listarClientes() {
    return this.service.listarClientes();
  }

  @Post('clientes')
  criarCliente(@Body() corpo: { slug: string; nomeMunicipio: string; uf: string }) {
    return this.service.criarCliente(corpo);
  }

  @Patch('clientes/:slug/ativo')
  definirAtivo(@Param('slug') slug: string, @Body('ativo') ativo: boolean) {
    return this.service.definirAtivo(slug, ativo === true);
  }

  @Post('clientes/migrar')
  migrarTodos() {
    return this.service.migrarTodos();
  }

  @Get('clientes/:slug/usuarios')
  listarUsuarios(@Param('slug') slug: string) {
    return this.service.listarUsuarios(slug);
  }

  @Patch('clientes/:slug/usuarios/:id/ativo')
  definirUsuarioAtivo(@Param('slug') slug: string, @Param('id') id: string, @Body('ativo') ativo: boolean) {
    return this.service.definirUsuarioAtivo(slug, id, ativo === true);
  }

  @Get('acessos')
  listarAcessos(@Query('municipio') slug?: string, @Query('dias') dias?: string, @Query('limite') limite?: string) {
    return this.service.listarAcessos({
      slug: slug || undefined,
      dias: dias ? Number(dias) : undefined,
      limite: limite ? Number(limite) : undefined,
    });
  }

  @Get('acessos/resumo')
  resumoAcessos(@Query('dias') dias?: string) {
    return this.service.resumoAcessos(dias ? Number(dias) : undefined);
  }

  @Get('clientes/:slug/backup')
  gerarBackup(@Param('slug') slug: string) {
    return this.service.gerarBackup(slug);
  }

  @Post('clientes/:slug/restaurar')
  restaurarBackup(@Param('slug') slug: string, @Body() backup: { versao?: number; tabelas?: Record<string, unknown[]> }) {
    return this.service.restaurarBackup(slug, backup);
  }
}
