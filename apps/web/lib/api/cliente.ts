const URL_BASE_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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
export async function chamarApi<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`${URL_BASE_API}${caminho}`, {
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
