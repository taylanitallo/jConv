import { Module } from '@nestjs/common';
import { IaController } from './ia.controller';
import { IaService } from './ia.service';
import { DashboardService } from '../dashboard/dashboard.service';

@Module({
  controllers: [IaController],
  providers: [IaService, DashboardService],
})
export class IaModule {}
