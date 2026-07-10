import type {
  OrgaoConcedente,
  EmpresaContratada,
  Convenio,
  Proposta,
  CessaoTerreno,
  LimiteCusteio,
  Medicao,
  Repasse,
  Aditivo,
  Usuario,
  DocumentoAnexo,
} from '@jconv/compartilhado';
import { chamarApi } from './cliente';

function recurso<TItem, TCriar, TAtualizar = Partial<TCriar>>(caminhoBase: string) {
  return {
    listar: (query = '') => chamarApi<TItem[]>(`${caminhoBase}${query}`),
    obter: (id: string) => chamarApi<TItem>(`${caminhoBase}/${id}`),
    criar: (dados: TCriar) => chamarApi<TItem>(caminhoBase, { method: 'POST', body: JSON.stringify(dados) }),
    atualizar: (id: string, dados: TAtualizar) =>
      chamarApi<TItem>(`${caminhoBase}/${id}`, { method: 'PATCH', body: JSON.stringify(dados) }),
    excluir: (id: string) => chamarApi<{ sucesso: boolean }>(`${caminhoBase}/${id}`, { method: 'DELETE' }),
  };
}

export const orgaosConcedentesApi = recurso<OrgaoConcedente, Record<string, unknown>>('/orgaos-concedentes');
export const empresasContratadasApi = recurso<EmpresaContratada, Record<string, unknown>>('/empresas-contratadas');
export const convenioApi = recurso<Convenio, Record<string, unknown>>('/convenios');
export const propostasApi = recurso<Proposta, Record<string, unknown>>('/propostas');
export const cessoesTerrenoApi = recurso<CessaoTerreno, Record<string, unknown>>('/cessoes-terreno');
export const limitesCusteioApi = recurso<LimiteCusteio, Record<string, unknown>>('/limites-custeio');
export const usuariosApi = recurso<Usuario, Record<string, unknown>>('/usuarios');

export const propostasExtra = {
  promover: (id: string, dados: Record<string, unknown>) =>
    chamarApi<{ convenioId: string }>(`/propostas/${id}/promover`, { method: 'POST', body: JSON.stringify(dados) }),
};

export const medicoesApi = {
  listar: (convenioId: string) => chamarApi<Medicao[]>(`/convenios/${convenioId}/medicoes`),
  criar: (convenioId: string, dados: Record<string, unknown>) =>
    chamarApi<Medicao>(`/convenios/${convenioId}/medicoes`, { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (convenioId: string, id: string, dados: Record<string, unknown>) =>
    chamarApi<Medicao>(`/convenios/${convenioId}/medicoes/${id}`, { method: 'PATCH', body: JSON.stringify(dados) }),
  excluir: (convenioId: string, id: string) =>
    chamarApi<{ sucesso: boolean }>(`/convenios/${convenioId}/medicoes/${id}`, { method: 'DELETE' }),
};

export const repassesApi = {
  listar: (convenioId: string) => chamarApi<Repasse[]>(`/convenios/${convenioId}/repasses`),
  criar: (convenioId: string, dados: Record<string, unknown>) =>
    chamarApi<Repasse>(`/convenios/${convenioId}/repasses`, { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (convenioId: string, id: string, dados: Record<string, unknown>) =>
    chamarApi<Repasse>(`/convenios/${convenioId}/repasses/${id}`, { method: 'PATCH', body: JSON.stringify(dados) }),
  excluir: (convenioId: string, id: string) =>
    chamarApi<{ sucesso: boolean }>(`/convenios/${convenioId}/repasses/${id}`, { method: 'DELETE' }),
};

export const aditivosApi = {
  listar: (convenioId: string) => chamarApi<Aditivo[]>(`/convenios/${convenioId}/aditivos`),
  criar: (convenioId: string, dados: Record<string, unknown>) =>
    chamarApi<Aditivo>(`/convenios/${convenioId}/aditivos`, { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (convenioId: string, id: string, dados: Record<string, unknown>) =>
    chamarApi<Aditivo>(`/convenios/${convenioId}/aditivos/${id}`, { method: 'PATCH', body: JSON.stringify(dados) }),
  excluir: (convenioId: string, id: string) =>
    chamarApi<{ sucesso: boolean }>(`/convenios/${convenioId}/aditivos/${id}`, { method: 'DELETE' }),
};

export const iaApi = {
  perguntar: (pergunta: string) =>
    chamarApi<{ resposta: string }>('/ia/perguntar', { method: 'POST', body: JSON.stringify({ pergunta }) }),
  resumoConvenio: (convenioId: string) => chamarApi<{ resumo: string }>(`/ia/resumo/convenio/${convenioId}`),
  resumoGeral: (filtros: Record<string, string | undefined>) => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filtros).filter(([, v]) => !!v)) as Record<string, string>,
    );
    return chamarApi<{ resumo: string }>(`/ia/resumo/geral?${params.toString()}`);
  },
  extrairDocumento: (documentoId: string) =>
    chamarApi<Record<string, unknown>>(`/ia/extrair-documento/${documentoId}`, { method: 'POST' }),
};

export const documentosAnexosApi = {
  listar: (filtro: { convenioId?: string; propostaId?: string; cessaoTerrenoId?: string }) => {
    const params = new URLSearchParams(filtro as Record<string, string>).toString();
    return chamarApi<DocumentoAnexo[]>(`/documentos-anexos?${params}`);
  },
  criarUploadAssinado: (nomeArquivo: string) =>
    chamarApi<{ caminho: string; urlAssinada: string; token: string }>('/documentos-anexos/upload-assinado', {
      method: 'POST',
      body: JSON.stringify({ nomeArquivo }),
    }),
  registrar: (dados: Record<string, unknown>) =>
    chamarApi<DocumentoAnexo>('/documentos-anexos', { method: 'POST', body: JSON.stringify(dados) }),
  obterUrlDownload: (id: string) => chamarApi<{ url: string }>(`/documentos-anexos/${id}/download`),
  excluir: (id: string) => chamarApi<{ sucesso: boolean }>(`/documentos-anexos/${id}`, { method: 'DELETE' }),
};
