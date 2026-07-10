import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { AtualizarOrgaoConcedente, CriarOrgaoConcedente } from '@jconv/compartilhado';
import { desembrulhar } from '../../comum/supabase-erro';

@Injectable()
export class OrgaosConcedentesService {
  async listar(cliente: SupabaseClient) {
    return desembrulhar(await cliente.from('orgaos_concedentes').select('*').order('nome'));
  }

  async obter(cliente: SupabaseClient, id: string) {
    return desembrulhar(await cliente.from('orgaos_concedentes').select('*').eq('id', id).single());
  }

  async criar(cliente: SupabaseClient, dados: CriarOrgaoConcedente) {
    return desembrulhar(
      await cliente
        .from('orgaos_concedentes')
        .insert({
          nome: dados.nome,
          esfera: dados.esfera,
          parlamentar_padrinho: dados.parlamentarPadrinho ?? null,
          contato: dados.contato ?? null,
        })
        .select()
        .single(),
    );
  }

  async atualizar(cliente: SupabaseClient, id: string, dados: AtualizarOrgaoConcedente) {
    const payload: Record<string, unknown> = {};
    if (dados.nome !== undefined) payload.nome = dados.nome;
    if (dados.esfera !== undefined) payload.esfera = dados.esfera;
    if (dados.parlamentarPadrinho !== undefined) payload.parlamentar_padrinho = dados.parlamentarPadrinho;
    if (dados.contato !== undefined) payload.contato = dados.contato;

    return desembrulhar(await cliente.from('orgaos_concedentes').update(payload).eq('id', id).select().single());
  }

  async excluir(cliente: SupabaseClient, id: string) {
    desembrulhar(await cliente.from('orgaos_concedentes').delete().eq('id', id));
  }
}
