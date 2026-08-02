import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { AtualizarUsuario, CriarUsuario } from '@jconv/compartilhado';
import { desembrulhar } from '../../comum/supabase-erro';
import { SUPABASE_ADMIN_CLIENT } from '../../configuracao/supabase.provider';

@Injectable()
export class UsuariosService {
  constructor(@Inject(SUPABASE_ADMIN_CLIENT) private readonly supabaseAdmin: SupabaseClient) {}

  async listar(cliente: SupabaseClient) {
    return desembrulhar(await cliente.from('usuarios').select('*').order('nome'));
  }

  async obter(cliente: SupabaseClient, id: string) {
    return desembrulhar(await cliente.from('usuarios').select('*').eq('id', id).single());
  }

  // Cria o usuário no Supabase Auth via convite por e-mail (nunca geramos/vemos senha aqui —
  // o próprio usuário define pelo link recebido) e já grava o perfil em public.usuarios.
  async criar(cliente: SupabaseClient, dados: CriarUsuario) {
    const { data: convite, error: erroConvite } = await this.supabaseAdmin.auth.admin.inviteUserByEmail(dados.email);
    if (erroConvite) throw erroConvite;

    return desembrulhar(
      await cliente
        .from('usuarios')
        .insert({
          id: convite.user.id,
          nome: dados.nome,
          email: dados.email,
          papel: dados.papel,
          // O escopo do LeituraSecretario vem da secretaria (migration 0024).
          secretaria_id: dados.secretariaId ?? null,
        })
        .select()
        .single(),
    );
  }

  async atualizar(cliente: SupabaseClient, id: string, dados: AtualizarUsuario) {
    const payload: Record<string, unknown> = {};
    if (dados.nome !== undefined) payload.nome = dados.nome;
    if (dados.papel !== undefined) payload.papel = dados.papel;
    if (dados.ativo !== undefined) payload.ativo = dados.ativo;
    if (dados.secretariaId !== undefined) payload.secretaria_id = dados.secretariaId;

    if (Object.keys(payload).length === 0) {
      return desembrulhar(await cliente.from('usuarios').select('*').eq('id', id).single());
    }

    return desembrulhar(await cliente.from('usuarios').update(payload).eq('id', id).select().single());
  }
}
