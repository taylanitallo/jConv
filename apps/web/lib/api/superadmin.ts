import { ErroApi } from './cliente';

/**
 * Chamadas da área de superadmin. Cliente separado de propósito: as rotas de município exigem o
 * cabeçalho x-municipio, e estas não têm município nenhum — mandar um aqui só criaria a ideia
 * falsa de que a tela opera dentro de uma prefeitura.
 */
export async function chamarSuperadmin<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`/api/superadmin${caminho}`, {
    ...opcoes,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...opcoes.headers },
  });

  const corpo = await resposta.json().catch(() => undefined);
  if (!resposta.ok) {
    // Sessão ausente ou expirada leva à entrada da própria administração — nunca à de um
    // município, que é outra coisa. O /login é a exceção: lá o 401 é a resposta legítima a uma
    // credencial errada, e redirecionar para a página onde já se está apagaria o erro da tela.
    if (resposta.status === 401 && caminho !== '/login' && typeof window !== 'undefined') {
      window.location.replace('/superadmin/login');
      // Interrompe a cadeia: a navegação já está a caminho e a tela não deve renderizar erro.
      await new Promise(() => undefined);
    }
    throw new ErroApi(corpo?.message ?? 'Erro ao comunicar com o servidor', resposta.status, corpo);
  }
  return corpo as T;
}

export interface ClienteMunicipio {
  id: string;
  slug: string;
  nomeMunicipio: string;
  uf: string;
  schemaNome: string;
  ativo: boolean;
  criadoEm: string;
  migracoesAplicadas: number;
  usuarios: number;
  convenios: number;
}

export interface UsuarioDoMunicipio {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  criado_em: string;
  modulos: number;
}

export interface Acesso {
  id: string;
  email: string;
  cliente_slug: string | null;
  sucesso: boolean;
  motivo: string | null;
  ip: string | null;
  criado_em: string;
}

export interface ResumoAcesso {
  cliente_slug: string | null;
  entradas: number;
  falhas: number;
  usuarios_distintos: number;
  ultimo_acesso: string;
}
