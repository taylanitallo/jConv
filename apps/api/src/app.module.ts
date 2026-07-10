import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfiguracaoModule } from './configuracao/configuracao.module';
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

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfiguracaoModule,
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
  ],
})
export class AppModule {}
