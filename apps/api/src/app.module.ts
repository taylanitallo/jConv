import { Module } from '@nestjs/common';
import { ConfiguracaoModule } from './configuracao/configuracao.module';
import { AutenticacaoModule } from './modulos/autenticacao/autenticacao.module';

@Module({
  imports: [ConfiguracaoModule, AutenticacaoModule],
})
export class AppModule {}
