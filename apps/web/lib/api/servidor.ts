import { cookies } from 'next/headers';

const URL_BASE_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface UsuarioAutenticado {
  id: string;
  email: string;
}

export class ErroApiIndisponivel extends Error {
  constructor(urlApi: string, causa: unknown) {
    super(
      `Não foi possível conectar ao servidor da API em ${urlApi}. ` +
        'Verifique se a API está no ar e se NEXT_PUBLIC_API_URL aponta para ela.',
    );
    this.name = 'ErroApiIndisponivel';
    this.cause = causa;
  }
}

// Usado em Server Components/layouts: repassa os cookies da requisição recebida para a API
// NestJS (fetch do servidor não tem acesso automático aos cookies do navegador) e retorna
// null se a sessão estiver ausente/expirada, para o layout decidir redirecionar ao /login.
export async function obterUsuarioAtual(): Promise<UsuarioAutenticado | null> {
  let resposta: Response;

  try {
    resposta = await fetch(`${URL_BASE_API}/auth/me`, {
      headers: { Cookie: cookies().toString() },
      cache: 'no-store',
    });
  } catch (causa) {
    // API fora do ar NÃO é o mesmo que sessão ausente: devolver null aqui mandaria o usuário
    // para /login, onde o login também falharia — mensagem enganosa. Erro explícito, tratado
    // pelo error boundary do segmento (app)/error.tsx.
    throw new ErroApiIndisponivel(URL_BASE_API, causa);
  }

  if (!resposta.ok) {
    return null;
  }

  const corpo = await resposta.json();
  return corpo.usuario ?? null;
}
