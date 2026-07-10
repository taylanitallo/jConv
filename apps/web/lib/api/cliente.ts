export class ErroApi extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detalhes?: unknown,
  ) {
    super(message);
  }
}

// Wrapper fino sobre fetch para chamar a API NestJS sempre com credentials: 'include' — é o
// cookie HTTP-only enviado pelo backend no /auth/login que autentica cada requisição seguinte.
// Chama /api/... (mesmo domínio do site, ver rewrite em next.config.js) em vez do domínio da
// API direto — só assim o Set-Cookie da resposta fica visível pro middleware e pelos Server
// Components do Next, já que web e api ficam em domínios diferentes em produção.
export async function chamarApi<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`/api${caminho}`, {
    ...opcoes,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...opcoes.headers,
    },
  });

  const corpo = await resposta.json().catch(() => undefined);

  if (!resposta.ok) {
    throw new ErroApi(corpo?.message ?? 'Erro ao comunicar com o servidor', resposta.status, corpo);
  }

  return corpo as T;
}
