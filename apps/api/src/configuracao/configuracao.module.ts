import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfiguracaoService } from './configuracao.service';
import { SUPABASE_ADMIN_CLIENT, criarClienteSupabaseAdmin } from './supabase.provider';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    ConfiguracaoService,
    {
      provide: SUPABASE_ADMIN_CLIENT,
      inject: [ConfiguracaoService],
      useFactory: criarClienteSupabaseAdmin,
    },
  ],
  exports: [ConfiguracaoService, SUPABASE_ADMIN_CLIENT],
})
export class ConfiguracaoModule {}
