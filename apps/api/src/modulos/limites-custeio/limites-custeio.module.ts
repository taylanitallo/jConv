import { Module } from '@nestjs/common';
import { LimitesCusteioController } from './limites-custeio.controller';
import { LimitesCusteioService } from './limites-custeio.service';

@Module({
  controllers: [LimitesCusteioController],
  providers: [LimitesCusteioService],
})
export class LimitesCusteioModule {}
