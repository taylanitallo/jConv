import { Module } from '@nestjs/common';
import { DocumentosAnexosController } from './documentos-anexos.controller';
import { DocumentosAnexosService } from './documentos-anexos.service';

@Module({
  controllers: [DocumentosAnexosController],
  providers: [DocumentosAnexosService],
})
export class DocumentosAnexosModule {}
