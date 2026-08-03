import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ClienteDados } from '../../banco/cliente-dados';
import { CriarDocumentoAnexo } from '@jconv/compartilhado';
import { desembrulhar } from '../../comum/supabase-erro';
import { SUPABASE_ADMIN_CLIENT } from '../../configuracao/supabase.provider';

export const BUCKET_DOCUMENTOS = 'documentos-anexos';

export interface FiltrosDocumentoAnexo {
  convenioId?: string;
  propostaId?: string;
  cessaoTerrenoId?: string;
}

@Injectable()
export class DocumentosAnexosService {
  // O Storage e um bucket unico, compartilhado entre municipios, entao a RLS dele nao consegue
  // saber de qual prefeitura e a requisicao — as policies resolveriam pode_ver() em public e
  // decidiriam pelas permissoes do municipio errado. Quem autoriza aqui e a API: o guard de
  // permissao ja rodou e o documento ja foi lido no schema do municipio antes de chegar neste
  // ponto. As URLs assinadas que saem daqui sao pre-autorizadas e nao dependem da RLS.
  constructor(@Inject(SUPABASE_ADMIN_CLIENT) private readonly armazenamento: SupabaseClient) {}

  async listar(cliente: ClienteDados, filtros: FiltrosDocumentoAnexo) {
    let consulta = cliente.from('documentos_anexos').select('*').order('data_upload', { ascending: false });
    if (filtros.convenioId) consulta = consulta.eq('convenio_id', filtros.convenioId);
    if (filtros.propostaId) consulta = consulta.eq('proposta_id', filtros.propostaId);
    if (filtros.cessaoTerrenoId) consulta = consulta.eq('cessao_terreno_id', filtros.cessaoTerrenoId);
    return desembrulhar(await consulta);
  }

  // Gera uma URL assinada de upload direto para o Supabase Storage (o navegador envia o
  // arquivo direto pro Storage; a API só registra o metadado depois, evitando passar o
  // binário do arquivo pelo NestJS).
  async criarUploadAssinado(slugMunicipio: string, nomeArquivo: string) {
    // Prefixo do município na chave: os buckets são compartilhados entre clientes, então é o
    // caminho que separa os arquivos de uma prefeitura dos da outra.
    const caminho = `${slugMunicipio}/${randomUUID()}-${nomeArquivo}`;
    const { data, error } = await this.armazenamento.storage.from(BUCKET_DOCUMENTOS).createSignedUploadUrl(caminho);
    if (error) throw error;
    return { caminho, urlAssinada: data.signedUrl, token: data.token };
  }

  async registrarDocumento(cliente: ClienteDados, dados: CriarDocumentoAnexo) {
    return desembrulhar(
      await cliente
        .from('documentos_anexos')
        .insert({
          convenio_id: dados.convenioId ?? null,
          proposta_id: dados.propostaId ?? null,
          cessao_terreno_id: dados.cessaoTerrenoId ?? null,
          tipo: dados.tipo,
          nome_arquivo: dados.nomeArquivo,
          arquivo_caminho: dados.arquivoCaminho,
        })
        .select()
        .single(),
    );
  }

  async obterUrlDownload(cliente: ClienteDados, id: string) {
    const documento = desembrulhar(
      await cliente.from('documentos_anexos').select('arquivo_caminho').eq('id', id).single(),
    ) as { arquivo_caminho: string };

    const { data, error } = await this.armazenamento.storage
      .from(BUCKET_DOCUMENTOS)
      .createSignedUrl(documento.arquivo_caminho, 60 * 5);
    if (error) throw error;
    return { url: data.signedUrl };
  }

  async excluir(cliente: ClienteDados, id: string) {
    const documento = desembrulhar(
      await cliente.from('documentos_anexos').select('arquivo_caminho').eq('id', id).single(),
    ) as { arquivo_caminho: string };

    await this.armazenamento.storage.from(BUCKET_DOCUMENTOS).remove([documento.arquivo_caminho]);
    desembrulhar(await cliente.from('documentos_anexos').delete().eq('id', id));
  }
}
