import { Module } from '@nestjs/common';
import { AutenticacaoController } from './autenticacao.controller';
import { AutenticacaoService } from './autenticacao.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';

@Module({
  controllers: [AutenticacaoController],
  providers: [AutenticacaoService, AutenticacaoGuard],
  exports: [AutenticacaoGuard],
})
export class AutenticacaoModule {}
