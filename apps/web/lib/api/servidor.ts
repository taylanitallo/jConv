import { cookies } from 'next/headers';

const URL_BASE_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface UsuarioAutenticado {
  id: string;
  email: string;
}

// Usado em Server Components/layouts: repassa os cookies da requisição recebida para a API
// NestJS (fetch do servidor não tem acesso automático aos cookies do navegador) e retorna
// null se a sessão estiver ausente/expirada, para o layout decidir redirecionar ao /login.
export async function obterUsuarioAtual(): Promise<UsuarioAutenticado | null> {
  const resposta = await fetch(`${URL_BASE_API}/auth/me`, {
    headers: { Cookie: cookies().toString() },
    cache: 'no-store',
  });

  if (!resposta.ok) {
    return null;
  }

  const corpo = await resposta.json();
  return corpo.usuario ?? null;
}
