// Módulos do sistema = telas. A granularidade é por tela: tudo que pendura num convênio
// (medições, repasses, aditivos, documentos, histórico) segue o nível do módulo Convenios.
export const MODULOS_SISTEMA = [
  'Dashboard',
  'Convenios',
  'Propostas',
  'CessoesTerreno',
  'LimitesCusteio',
  'OrgaosConcedentes',
  'EmpresasContratadas',
  'ConfiguracoesGerais',
  'ConfiguracoesMunicipio',
  'ConfiguracoesSecretarias',
  'ConfiguracoesLayout',
  'Usuarios',
] as const;
export type ModuloSistema = (typeof MODULOS_SISTEMA)[number];

export const ROTULOS_MODULO_SISTEMA: Record<ModuloSistema, string> = {
  Dashboard: 'Dashboard',
  Convenios: 'Convênios',
  Propostas: 'Propostas',
  CessoesTerreno: 'Cessões de Terreno',
  LimitesCusteio: 'Limites de Custeio',
  OrgaosConcedentes: 'Órgãos Concedentes',
  EmpresasContratadas: 'Empresas Contratadas',
  ConfiguracoesGerais: 'Configurações › Gerais',
  ConfiguracoesMunicipio: 'Configurações › Município',
  ConfiguracoesSecretarias: 'Configurações › Secretarias',
  ConfiguracoesLayout: 'Configurações › Layout',
  Usuarios: 'Configurações › Usuários',
};

/** Agrupamento só para exibição na janela de Atribuições. */
export const GRUPOS_MODULO: { titulo: string; modulos: ModuloSistema[] }[] = [
  {
    titulo: 'Operacional',
    modulos: ['Dashboard', 'Convenios', 'Propostas', 'CessoesTerreno', 'LimitesCusteio'],
  },
  { titulo: 'Cadastros', modulos: ['OrgaosConcedentes', 'EmpresasContratadas'] },
  {
    titulo: 'Configurações',
    modulos: ['ConfiguracoesGerais', 'ConfiguracoesMunicipio', 'ConfiguracoesSecretarias', 'ConfiguracoesLayout', 'Usuarios'],
  },
];

export const NIVEIS_PERMISSAO = ['Nenhuma', 'Parcial', 'Total'] as const;
export type NivelPermissao = (typeof NIVEIS_PERMISSAO)[number];

export const ROTULOS_NIVEL_PERMISSAO: Record<NivelPermissao, string> = {
  Nenhuma: 'Sem permissão',
  Parcial: 'Parcial',
  Total: 'Total',
};

export const DESCRICOES_NIVEL_PERMISSAO: Record<NivelPermissao, string> = {
  Nenhuma: 'Não aparece para o usuário',
  Parcial: 'Vê, mas não altera',
  Total: 'Vê, inclui, edita e exclui',
};

export function podeVer(nivel: NivelPermissao | undefined) {
  return nivel === 'Parcial' || nivel === 'Total';
}

export function podeEditar(nivel: NivelPermissao | undefined) {
  return nivel === 'Total';
}
