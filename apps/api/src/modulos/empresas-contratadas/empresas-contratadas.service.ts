import { Injectable } from '@nestjs/common';
import { ClienteDados } from '../../banco/cliente-dados';
import { AtualizarEmpresaContratada, CriarEmpresaContratada } from '@jconv/compartilhado';
import { desembrulhar } from '../../comum/supabase-erro';

@Injectable()
export class EmpresasContratadasService {
  async listar(cliente: ClienteDados) {
    return desembrulhar(await cliente.from('empresas_contratadas').select('*').order('nome'));
  }

  async obter(cliente: ClienteDados, id: string) {
    return desembrulhar(await cliente.from('empresas_contratadas').select('*').eq('id', id).single());
  }

  async criar(cliente: ClienteDados, dados: CriarEmpresaContratada) {
    return desembrulhar(
      await cliente
        .from('empresas_contratadas')
        .insert({ nome: dados.nome, responsavel_contato: dados.responsavelContato ?? null, cnpj: dados.cnpj ?? null })
        .select()
        .single(),
    );
  }

  async atualizar(cliente: ClienteDados, id: string, dados: AtualizarEmpresaContratada) {
    const payload: Record<string, unknown> = {};
    if (dados.nome !== undefined) payload.nome = dados.nome;
    if (dados.responsavelContato !== undefined) payload.responsavel_contato = dados.responsavelContato;
    if (dados.cnpj !== undefined) payload.cnpj = dados.cnpj;

    return desembrulhar(await cliente.from('empresas_contratadas').update(payload).eq('id', id).select().single());
  }

  async excluir(cliente: ClienteDados, id: string) {
    desembrulhar(await cliente.from('empresas_contratadas').delete().eq('id', id));
  }
}
