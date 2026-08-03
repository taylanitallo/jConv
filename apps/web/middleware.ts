import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const NOME_COOKIE_ACCESS_TOKEN = 'jconv_access_token';

/** Repassado adiante na requisição para os Server Components lerem via headers(), evitando
 *  passar o slug de página em página como prop. */
export const CABECALHO_MUNICIPIO = 'x-municipio';

const MUNICIPIO_PADRAO = process.env.NEXT_PUBLIC_MUNICIPIO_PADRAO ?? 'iraucuba';
const FORMATO_SLUG = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

// "convenios" tem exatamente a mesma cara de um slug de município, então o formato sozinho não
// distingue /convenios (link antigo) de /iraucuba. As seções do app são um conjunto fechado e
// conhecido — é por elas que dá para separar os dois casos.
const SECOES_DO_APP = new Set([
  'convenios',
  'propostas',
  'cessoes-terreno',
  'limites-custeio',
  'orgaos-concedentes',
  'empresas-contratadas',
  'configuracoes',
  'login',
  'definir-senha',
]);

// O primeiro segmento do caminho é o município: /iraucuba/convenios. O middleware resolve o
// slug, injeta no cabeçalho da requisição e só então decide sobre a sessão.
//
// A checagem de cookie aqui é triagem de borda, para não renderizar a área autenticada sem
// sessão nenhuma. Validade do token e existência do município são conferidas no servidor
// (obterUsuarioAtual() no layout, que chama /auth/me).
export function middleware(requisicao: NextRequest) {
  const { pathname } = requisicao.nextUrl;
  const [, primeiro, ...resto] = pathname.split('/');

  // Sem município na URL não há como saber de quem são os dados: manda para o padrão,
  // preservando o resto do caminho — bookmark antigo /convenios vira /iraucuba/convenios.
  if (!FORMATO_SLUG.test(primeiro) || SECOES_DO_APP.has(primeiro)) {
    const destino = new URL(`/${MUNICIPIO_PADRAO}${pathname === '/' ? '' : pathname}`, requisicao.url);
    destino.search = requisicao.nextUrl.search;
    return NextResponse.redirect(destino);
  }

  const cabecalhos = new Headers(requisicao.headers);
  cabecalhos.set(CABECALHO_MUNICIPIO, primeiro);

  const ehRotaPublica = resto[0] === 'login' || resto[0] === 'definir-senha';
  if (!ehRotaPublica && !requisicao.cookies.get(NOME_COOKIE_ACCESS_TOKEN)) {
    return NextResponse.redirect(new URL(`/${primeiro}/login`, requisicao.url));
  }

  return NextResponse.next({ request: { headers: cabecalhos } });
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|superadmin).*)'],
};
