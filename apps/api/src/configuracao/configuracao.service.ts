import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfiguracaoService {
  constructor(private readonly config: ConfigService) {}

  private obrigatoria(chave: string): string {
    const valor = this.config.get<string>(chave);
    if (!valor) {
      throw new Error(`Variável de ambiente obrigatória ausente: ${chave}`);
    }
    return valor;
  }

  get supabaseUrl(): string {
    return this.obrigatoria('SUPABASE_URL');
  }

  get supabaseAnonKey(): string {
    return this.obrigatoria('SUPABASE_ANON_KEY');
  }

  get supabaseServiceRoleKey(): string {
    return this.obrigatoria('SUPABASE_SERVICE_ROLE_KEY');
  }

  get urlFrontend(): string {
    return this.config.get<string>('URL_FRONTEND') ?? 'http://localhost:3000';
  }

  get porta(): number {
    return Number(this.config.get<string>('PORT') ?? 3001);
  }

  get ambienteProducao(): boolean {
    return this.config.get<string>('NODE_ENV') === 'production';
  }

  // Opcional de propósito (Fase 6): sem chave configurada, o IaModule responde 503 em vez de
  // derrubar a API inteira — a camada de IA não é pré-requisito pras demais fases funcionarem.
  get anthropicApiKey(): string | undefined {
    return this.config.get<string>('ANTHROPIC_API_KEY');
  }
}
