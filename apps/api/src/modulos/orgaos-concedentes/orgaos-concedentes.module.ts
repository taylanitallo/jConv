import { Module } from '@nestjs/common';
import { OrgaosConcedentesController } from './orgaos-concedentes.controller';
import { OrgaosConcedentesService } from './orgaos-concedentes.service';

@Module({
  controllers: [OrgaosConcedentesController],
  providers: [OrgaosConcedentesService],
})
export class OrgaosConcedentesModule {}
