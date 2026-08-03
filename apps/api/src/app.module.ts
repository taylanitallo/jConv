import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfiguracaoModule } from './configuracao/configuracao.module';
import { BancoModule } from './banco/banco.module';
import { TenantMiddleware } from './banco/tenant.middleware';
import { AutenticacaoModule } from './modulos/autenticacao/autenticacao.module';
import { UsuariosModule } from './modulos/usuarios/usuarios.module';
import { OrgaosConcedentesModule } from './modulos/orgaos-concedentes/orgaos-concedentes.module';
import { EmpresasContratadasModule } from './modulos/empresas-contratadas/empresas-contratadas.module';
import { ConveniosModule } from './modulos/convenios/convenios.module';
import { PropostasModule } from './modulos/propostas/propostas.module';
import { CessoesTerrenoModule } from './modulos/cessoes-terreno/cessoes-terreno.module';
import { LimitesCusteioModule } from './modulos/limites-custeio/limites-custeio.module';
import { DocumentosAnexosModule } from './modulos/documentos-anexos/documentos-anexos.module';
import { DashboardModule } from './modulos/dashboard/dashboard.module';
import { AlertasModule } from './modulos/alertas/alertas.module';
import { RelatoriosModule } from './modulos/relatorios/relatorios.module';
import { IaModule } from './modulos/ia/ia.module';
import { ConfiguracoesModuloModule } from './modulos/configuracoes/configuracoes-modulo.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfiguracaoModule,
    BancoModule,
    AutenticacaoModule,
    UsuariosModule,
    OrgaosConcedentesModule,
    EmpresasContratadasModule,
    ConveniosModule,
    PropostasModule,
    CessoesTerrenoModule,
    LimitesCusteioModule,
    DocumentosAnexosModule,
    DashboardModule,
    AlertasModule,
    RelatoriosModule,
    IaModule,
    ConfiguracoesModuloModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumidor: MiddlewareConsumer) {
    // Login e logout acontecem antes de qualquer escolha de município e falam só com o Supabase
    // Auth; o resto da API é sempre dentro de um município.
    consumidor
      .apply(TenantMiddleware)
      .exclude('auth/login', 'auth/logout', 'saude')
      .forRoutes('*');
  }
}
