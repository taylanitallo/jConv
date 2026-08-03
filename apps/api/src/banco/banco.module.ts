import { Global, Module } from '@nestjs/common';
import { BancoService } from './banco.service';

// Global porque todo controller precisa da conexão do município; sem isso cada módulo teria de
// importar este aqui, e a lista só cresceria.
@Global()
@Module({
  providers: [BancoService],
  exports: [BancoService],
})
export class BancoModule {}
