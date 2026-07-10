// Converte as chaves snake_case devolvidas pelo PostgREST (Supabase) para camelCase, usado por
// todos os controllers no caminho de leitura antes de responder ao frontend. A escrita
// (camelCase -> snake_case) é feita explicitamente em cada service, para manter clara a lista
// de colunas realmente gravadas.
export function paraCamelCase<T = unknown>(valor: unknown): T {
  if (Array.isArray(valor)) {
    return valor.map((item) => paraCamelCase(item)) as unknown as T;
  }
  if (valor !== null && typeof valor === 'object' && !(valor instanceof Date)) {
    const resultado: Record<string, unknown> = {};
    for (const [chave, v] of Object.entries(valor as Record<string, unknown>)) {
      const chaveCamel = chave.replace(/_([a-z0-9])/g, (_match, c: string) => c.toUpperCase());
      resultado[chaveCamel] = paraCamelCase(v);
    }
    return resultado as T;
  }
  return valor as T;
}
