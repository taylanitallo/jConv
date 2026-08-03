import { Module } from '@nestjs/common';
import { SuperadminController } from './superadmin.controller';
import { SuperadminAutenticacaoController } from './superadmin-autenticacao.controller';
import { SuperadminService } from './superadmin.service';
import { SuperadminGuard } from './superadmin.guard';

@Module({
  // O de autenticação vem primeiro: é ele que atende /superadmin/login, a única rota daqui que
  // não exige sessão.
  controllers: [SuperadminAutenticacaoController, SuperadminController],
  providers: [SuperadminService, SuperadminGuard],
})
export class SuperadminModule {}
