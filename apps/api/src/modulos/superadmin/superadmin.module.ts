import { Module } from '@nestjs/common';
import { SuperadminController } from './superadmin.controller';
import { SuperadminService } from './superadmin.service';
import { SuperadminGuard } from './superadmin.guard';

@Module({
  controllers: [SuperadminController],
  providers: [SuperadminService, SuperadminGuard],
})
export class SuperadminModule {}
