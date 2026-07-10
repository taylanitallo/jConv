import { Module } from '@nestjs/common';
import { CessoesTerrenoController } from './cessoes-terreno.controller';
import { CessoesTerrenoService } from './cessoes-terreno.service';

@Module({
  controllers: [CessoesTerrenoController],
  providers: [CessoesTerrenoService],
})
export class CessoesTerrenoModule {}
