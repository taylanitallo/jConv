import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { AtualizarCessaoTerreno, CriarCessaoTerreno } from '@jconv/compartilhado';
import { desembrulhar } from '../../comum/supabase-erro';

@Injectable()
export class CessoesTerrenoService {
  async listar(cliente: SupabaseClient) {
    return desembrulhar(await cliente.from('cessoes_terreno').select('*').order('criado_em', { ascending: false }));
  }

  async obter(cliente: SupabaseClient, id: string) {
    return desembrulhar(await cliente.from('cessoes_terreno').select('*').eq('id', id).single());
  }

  async criar(cliente: SupabaseClient, dados: CriarCessaoTerreno) {
    return desembrulhar(
      await cliente
        .from('cessoes_terreno')
        .insert({
          orgao_concedente_id: dados.orgaoConcedenteId,
          objeto: dados.objeto,
          numero_protocolo: dados.numeroProtocolo ?? null,
          numero_nup: dados.numeroNup ?? null,
          responsavel_interno: dados.responsavelInterno ?? null,
          status: dados.status,
          observacoes: dados.observacoes ?? null,
        })
        .select()
        .single(),
    );
  }

  async atualizar(cliente: SupabaseClient, id: string, dados: AtualizarCessaoTerreno) {
    const payload: Record<string, unknown> = {};
    if (dados.orgaoConcedenteId !== undefined) payload.orgao_concedente_id = dados.orgaoConcedenteId;
    if (dados.objeto !== undefined) payload.objeto = dados.objeto;
    if (dados.numeroProtocolo !== undefined) payload.numero_protocolo = dados.numeroProtocolo;
    if (dados.numeroNup !== undefined) payload.numero_nup = dados.numeroNup;
    if (dados.responsavelInterno !== undefined) payload.responsavel_interno = dados.responsavelInterno;
    if (dados.status !== undefined) payload.status = dados.status;
    if (dados.observacoes !== undefined) payload.observacoes = dados.observacoes;

    return desembrulhar(await cliente.from('cessoes_terreno').update(payload).eq('id', id).select().single());
  }

  async excluir(cliente: SupabaseClient, id: string) {
    desembrulhar(await cliente.from('cessoes_terreno').delete().eq('id', id));
  }
}
