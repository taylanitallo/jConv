import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { CriarObservacaoConvenio } from '@jconv/compartilhado';
import { desembrulhar } from '../../comum/supabase-erro';

// Histórico append-only: só listar e criar. Não existe atualizar nem excluir aqui — o banco
// também bloqueia por trigger (migration 0022), então não é só convenção de camada.
@Injectable()
export class ObservacoesService {
  async listar(cliente: SupabaseClient, convenioId: string) {
    return desembrulhar(
      await cliente
        .from('observacoes_convenio')
        .select('*')
        .eq('convenio_id', convenioId)
        .order('criado_em', { ascending: false }),
    );
  }

  async criar(cliente: SupabaseClient, dados: CriarObservacaoConvenio, autorNome: string) {
    return desembrulhar(
      await cliente
        .from('observacoes_convenio')
        .insert({
          convenio_id: dados.convenioId,
          texto: dados.texto,
          // autor_id vem do DEFAULT auth.uid() no banco; o nome é gravado junto para o
          // histórico continuar legível mesmo se o usuário mudar de nome ou sair.
          autor_nome: autorNome,
        })
        .select()
        .single(),
    );
  }
}
