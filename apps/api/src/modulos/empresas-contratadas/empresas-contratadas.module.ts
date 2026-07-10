import { Module } from '@nestjs/common';
import { EmpresasContratadasController } from './empresas-contratadas.controller';
import { EmpresasContratadasService } from './empresas-contratadas.service';

@Module({
  controllers: [EmpresasContratadasController],
  providers: [EmpresasContratadasService],
})
export class EmpresasContratadasModule {}
