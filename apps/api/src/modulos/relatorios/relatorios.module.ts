import { Module } from '@nestjs/common';
import { RelatoriosController } from './relatorios.controller';
import { RelatoriosService } from './relatorios.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { ConfiguracoesService } from '../configuracoes/configuracoes.service';

@Module({
  controllers: [RelatoriosController],
  // ConfiguracoesService entra como provider (e não via import do módulo) seguindo o mesmo
  // padrão já usado aqui para o DashboardService: são services sem estado.
  providers: [RelatoriosService, DashboardService, ConfiguracoesService],
})
export class RelatoriosModule {}
