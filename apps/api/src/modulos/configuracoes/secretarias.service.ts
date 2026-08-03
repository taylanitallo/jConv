import { Injectable } from '@nestjs/common';
import { ClienteDados } from '../../banco/cliente-dados';
import { AtualizarSecretaria, CriarSecretaria } from '@jconv/compartilhado';
import { desembrulhar } from '../../comum/supabase-erro';

@Injectable()
export class SecretariasService {
  async listar(cliente: ClienteDados) {
    return desembrulhar(await cliente.from('secretarias').select('*').order('nome'));
  }

  async obter(cliente: ClienteDados, id: string) {
    return desembrulhar(await cliente.from('secretarias').select('*').eq('id', id).single());
  }

  async listarOrgaos(cliente: ClienteDados, secretariaId: string) {
    return desembrulhar(
      await cliente.from('secretarias_orgaos').select('orgao_concedente_id').eq('secretaria_id', secretariaId),
    );
  }

  async criar(cliente: ClienteDados, dados: CriarSecretaria) {
    const secretaria = desembrulhar<{ id: string }>(
      await cliente
        .from('secretarias')
        .insert({
          nome: dados.nome,
          sigla: dados.sigla ?? null,
          secretario_responsavel: dados.secretarioResponsavel ?? null,
          contato: dados.contato ?? null,
          ativo: dados.ativo ?? true,
        })
        .select()
        .single(),
    );

    if (dados.orgaosConcedentesIds?.length) {
      await this.sincronizarOrgaos(cliente, secretaria.id, dados.orgaosConcedentesIds);
    }

    return secretaria;
  }

  async atualizar(cliente: ClienteDados, id: string, dados: AtualizarSecretaria) {
    const payload: Record<string, unknown> = {};
    if (dados.nome !== undefined) payload.nome = dados.nome;
    if (dados.sigla !== undefined) payload.sigla = dados.sigla;
    if (dados.secretarioResponsavel !== undefined) payload.secretario_responsavel = dados.secretarioResponsavel;
    if (dados.contato !== undefined) payload.contato = dados.contato;
    if (dados.ativo !== undefined) payload.ativo = dados.ativo;

    const secretaria =
      Object.keys(payload).length > 0
        ? desembrulhar(await cliente.from('secretarias').update(payload).eq('id', id).select().single())
        : desembrulhar(await cliente.from('secretarias').select('*').eq('id', id).single());

    if (dados.orgaosConcedentesIds !== undefined) {
      await this.sincronizarOrgaos(cliente, id, dados.orgaosConcedentesIds);
    }

    return secretaria;
  }

  async excluir(cliente: ClienteDados, id: string) {
    desembrulhar(await cliente.from('secretarias').delete().eq('id', id));
  }

  // Substitui o conjunto inteiro de órgãos da secretaria: é este vínculo que o RLS consulta
  // para decidir o que o LeituraSecretario enxerga.
  private async sincronizarOrgaos(cliente: ClienteDados, secretariaId: string, orgaosIds: string[]) {
    desembrulhar(await cliente.from('secretarias_orgaos').delete().eq('secretaria_id', secretariaId));
    if (orgaosIds.length > 0) {
      desembrulhar(
        await cliente.from('secretarias_orgaos').insert(
          orgaosIds.map((orgaoConcedenteId) => ({
            secretaria_id: secretariaId,
            orgao_concedente_id: orgaoConcedenteId,
          })),
        ),
      );
    }
  }
}
