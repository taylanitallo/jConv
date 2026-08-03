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
    // Não existe tela de login própria daqui: o cookie de sessão é o mesmo do sistema, então a
    // saída é entrar por um município e voltar. Sem esta mensagem, a tela mostraria só
    // "Não autenticado" e não diria o que fazer.
    if (resposta.status === 401) {
      throw new ErroApi('Entre no sistema por um município e volte a esta página.', 401, corpo);
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
