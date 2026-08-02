import { Module } from '@nestjs/common';
import { ConfiguracoesController } from './configuracoes.controller';
import { ConfiguracoesService } from './configuracoes.service';
import { SecretariasController } from './secretarias.controller';
import { SecretariasService } from './secretarias.service';

// Nome do arquivo com sufixo "-modulo" para não colidir com o ConfiguracaoModule já existente
// em src/configuracao, que cuida das variáveis de ambiente e é outra coisa.
@Module({
  controllers: [ConfiguracoesController, SecretariasController],
  providers: [ConfiguracoesService, SecretariasService],
  exports: [ConfiguracoesService],
})
export class ConfiguracoesModuloModule {}
