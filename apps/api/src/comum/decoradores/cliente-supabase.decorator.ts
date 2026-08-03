import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';

// Injeta o cliente de dados do município da requisição (ver TenantInterceptor), escopado ao
// usuário autenticado: tudo que passa por ele é filtrado pela RLS dentro do schema daquela
// prefeitura. Nunca usar o cliente admin (service role) para responder dados de negócio.
//
// O nome continua ClienteSupabase para não tocar nos 22 services de uma vez; o que mudou é a
// implementação por trás — de PostgREST para conexão direta com search_path do município.
export const ClienteSupabase = createParamDecorator((_dados: unknown, contexto: ExecutionContext) => {
  const requisicao = contexto.switchToHttp().getRequest<Request>();
  return requisicao.sessaoTenant?.cliente;
});

/**
 * Cliente supabase-js do usuário, mantido só para o Storage — os arquivos vivem em buckets,
 * fora dos schemas de município, então continuam sendo acessados por lá. Dados de negócio usam
 * o ClienteSupabase acima.
 */
export const ArmazenamentoSupabase = createParamDecorator((_dados: unknown, contexto: ExecutionContext) => {
  return contexto.switchToHttp().getRequest<Request>().supabaseClienteUsuario;
});

/** Município resolvido para a requisição — usado pelo superadmin e por logs. */
export const MunicipioAtual = createParamDecorator((_dados: unknown, contexto: ExecutionContext) => {
  return contexto.switchToHttp().getRequest<Request>().municipio;
});
