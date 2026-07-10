import { Module } from '@nestjs/common';
import { ConveniosController } from './convenios.controller';
import { ConveniosService } from './convenios.service';
import { MedicoesController } from './medicoes.controller';
import { MedicoesService } from './medicoes.service';
import { RepassesController } from './repasses.controller';
import { RepassesService } from './repasses.service';
import { AditivosController } from './aditivos.controller';
import { AditivosService } from './aditivos.service';

@Module({
  controllers: [ConveniosController, MedicoesController, RepassesController, AditivosController],
  providers: [ConveniosService, MedicoesService, RepassesService, AditivosService],
})
export class ConveniosModule {}
