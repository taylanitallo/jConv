// Entrada do histórico de observações de um convênio. É append-only: não existe atualizar
// nem excluir — a versão anterior continua no histórico (ver migration 0022).
export interface ObservacaoConvenio {
  id: string;
  convenioId: string;
  texto: string;
  autorId: string | null;
  /** Nome do autor no momento do registro; não muda se o usuário for renomeado depois. */
  autorNome: string | null;
  criadoEm: string;
}
