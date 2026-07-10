import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const NOME_COOKIE_ACCESS_TOKEN = 'jconv_access_token';

// Checagem rápida (edge) de presença do cookie de sessão, só para evitar renderizar a área
// autenticada sem cookie nenhum. A validade real do token (expirado, usuário desativado etc.)
// é sempre conferida no servidor via obterUsuarioAtual() no layout de (app), que chama /auth/me.
export function middleware(requisicao: NextRequest) {
  const token = requisicao.cookies.get(NOME_COOKIE_ACCESS_TOKEN);

  if (!token) {
    return NextResponse.redirect(new URL('/login', requisicao.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!login|_next|favicon.ico).*)'],
};
