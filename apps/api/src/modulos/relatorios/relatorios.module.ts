import { Module } from '@nestjs/common';
import { RelatoriosController } from './relatorios.controller';
import { RelatoriosService } from './relatorios.service';
import { DashboardService } from '../dashboard/dashboard.service';

@Module({
  controllers: [RelatoriosController],
  providers: [RelatoriosService, DashboardService],
})
export class RelatoriosModule {}
