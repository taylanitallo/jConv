import { Injectable } from '@nestjs/common';
import { ClienteDados } from '../../banco/cliente-dados';
import { AtualizarSecretaria, CriarSecretaria } from '@jconv/compartilhado';
import { desembrulhar } from '../../comum/supabase-erro';

// A secretaria guarda só o que a identifica. O responsável por ela passa a ser vínculo de
// usuário, e o alcance sobre convênios sai das permissões do usuário e do cadastro do convênio —
// não de uma lista de órgãos pendurada na secretaria.
@Injectable()
export class SecretariasService {
  async listar(cliente: ClienteDados) {
    return desembrulhar(await cliente.from('secretarias').select('*').order('nome'));
  }

  async obter(cliente: ClienteDados, id: string) {
    return desembrulhar(await cliente.from('secretarias').select('*').eq('id', id).single());
  }

  async criar(cliente: ClienteDados, dados: CriarSecretaria) {
    return desembrulhar(
      await cliente
        .from('secretarias')
        .insert({
          nome: dados.nome,
          sigla: dados.sigla ?? null,
          ativo: dados.ativo ?? true,
        })
        .select()
        .single(),
    );
  }

  async atualizar(cliente: ClienteDados, id: string, dados: AtualizarSecretaria) {
    const payload: Record<string, unknown> = {};
    if (dados.nome !== undefined) payload.nome = dados.nome;
    if (dados.sigla !== undefined) payload.sigla = dados.sigla;
    if (dados.ativo !== undefined) payload.ativo = dados.ativo;

    if (Object.keys(payload).length === 0) {
      return desembrulhar(await cliente.from('secretarias').select('*').eq('id', id).single());
    }

    return desembrulhar(await cliente.from('secretarias').update(payload).eq('id', id).select().single());
  }

  async excluir(cliente: ClienteDados, id: string) {
    desembrulhar(await cliente.from('secretarias').delete().eq('id', id));
  }
}
